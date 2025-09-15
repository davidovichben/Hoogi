import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, ArrowLeft, Upload, Plus, Trash2, Copy, GripVertical, Star, Calendar, Mic, Zap, Save, Lock, Eye, Settings, Users, Palette, RotateCcw, QrCode, Globe } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { Badge } from '../components/ui/badge';
import { HoogiMessage } from '../components/HoogiMascot';
import { TooltipWrapper } from '../components/TooltipWrapper';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast as useShadcnToast } from '@/hooks/use-toast';
import { getUserId, fetchProfileByUserId, upsertProfile } from '@/lib/rpc';
import { applyBrandingVars } from '@/lib/branding';
import { OCCUPATIONS } from '@/utils/occupations';
import { QRModal } from '../components/QRModal';
import { buildPublicUrl } from '../lib/publicUrl';
import { routes } from "@/routes";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Portal } from "@radix-ui/react-portal";
import { HexColorPicker } from "react-colorful";
import ProfileForm, { ProfileFormHandle } from "@/components/ProfileForm";
import { showSuccess, showError, showInfo } from "@/lib/toast";
import { fetchSuggestedQuestions } from "@/lib/suggestQuestions";

type ToastApi = ((opts: { title?: string; description?: string, variant?: 'default' | 'destructive' }) => void) | undefined;
function safeToast(toastApi: ToastApi, title: string, description?: string, variant?: 'default' | 'destructive') {
  try {
    if (typeof toastApi === "function") {
       toastApi({ title, description, variant });
    }
  } catch (_) { /* no-op */ }
}

type QuestionType = 'text' | 'single_choice' | 'multiple_choice' | 'rating' | 'date' | 'audio' | 'conditional' | 'email' | 'phone';

interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  isRequired: boolean;
  conditionalLogic?: {
    parentQuestionId: string;
    triggerValue: string;
  };
}

interface QuestionnaireState {
  id?: string;
  title: string;
  questions: Question[];
  status: 'draft' | 'locked' | 'pending';
  language: string;
}

interface ProfileData {
  companyName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  savedCategories: string[];
}

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  const { toast } = useShadcnToast();
  const profileRef = useRef<ProfileFormHandle>(null);
  const [canProceed, setCanProceed] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Load user on component mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };
    loadUser();
  }, []);
  
  // Get step and questionnaire ID from URL params using URLSearchParams
  const urlParams = new URLSearchParams(location.search);
  const urlStep = urlParams.get('step');
  const urlQuestionnaireId = urlParams.get('id');
  
  // לוגים בטוחים
  try {
    console.log("Onboarding component - URL", location?.search);
    console.log("params:", { urlStep: urlStep, urlQuestionnaireId: urlQuestionnaireId });
    console.log("Full URL:", window?.location?.href);
  } catch {}
  
  const [currentStep, setCurrentStep] = useState(urlStep ? parseInt(urlStep) : 1);
  const [isGeneratingOptions, setIsGeneratingOptions] = useState<string | null>(null);

  function goNextStep() {
    // העדפה: פונקציה קיימת אם יש
    // @ts-ignore
    if (typeof goToStep === "function") return goToStep(2);
    // @ts-ignore
    if (typeof setStep === "function") return setStep(2);
    // fallback: ניווט לשלב 2
    const url = new URL(window.location.href);
    url.searchParams.set("step", "2");
    window.location.assign(url.toString());
  }
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  
  // Public Link state
  const [publicLinkData, setPublicLinkData] = useState<{
    public_token?: string;
    default_lang?: string;
    is_published?: boolean;
  } | null>(null);
  const [publicLinkLoading, setPublicLinkLoading] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  
  const [formData, setFormData] = useState<QuestionnaireState>({
    id: urlQuestionnaireId || undefined,
    title: '',
    questions: [],
    status: 'draft',
    language: language
  });

  const [profileData, setProfileData] = useState<ProfileData>({
    companyName: '',
    logoUrl: '',
    primaryColor: '#16939B',
    secondaryColor: '#FFD500',
    savedCategories: []
  });

  // פונקציה לבדיקת קטגוריה תקינה
  function hasValidCategory() {
    if (!formData.category) return false;
    // אם הקטגוריה היא "אחר" - צריך לבדוק אם יש טקסט חופשי
    if (formData.category === "__other__") {
      return Boolean(formData.category && formData.category.trim().length > 1);
    }
    return Boolean(formData.category);
  }

  // Load saved profile data on component mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('hoogiProfile');
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setProfileData(profile);
    }
  }, []);

  // Prefill from Supabase profiles (מעדכן את הנתונים מפרופיל אמיתי)
  useEffect(() => {
    (async () => {
      try {
        const userId = await getUserId();
        if (!userId) return;
        
        const profile = await fetchProfileByUserId(userId);
        if (profile) {
          setProfileData(prev => ({
            ...prev,
            companyName: profile.business_name ?? prev.companyName,
            logoUrl: profile.brand_logo_path ?? prev.logoUrl,
            primaryColor: profile.brand_primary ?? prev.primaryColor,
            secondaryColor: profile.brand_secondary ?? prev.secondaryColor,
          }));
          
          // עדכון קטגוריה מהפרופיל
          if (profile.occupation) {
            setFormData(prev => ({
              ...prev,
              category: profile.occupation
            }));
          }
          
          // החלת מיתוג מלא
          applyBrandingVars({
            brand_primary: profile.brand_primary,
            brand_secondary: profile.brand_secondary,
            background_color: profile.background_color || "#ffffff"
          });
        }
      } catch (e: any) {
        console.warn('fetchProfile failed:', e?.message || e);
      }
    })();
  }, []);

  // Load existing questionnaire data if editing
  useEffect(() => {
    try {
    console.log('🔍 useEffect triggered - urlQuestionnaireId:', urlQuestionnaireId, 'urlStep:', urlStep);
    } catch {}
    if (urlQuestionnaireId) {
      try {
      console.log('📥 Loading existing questionnaire for ID:', urlQuestionnaireId);
      } catch {}
      loadExistingQuestionnaire(urlQuestionnaireId);
    }
  }, [urlQuestionnaireId, urlStep]); // הוספתי urlStep כדי שיטען גם כשמשתנה השלב

  // Update current step when URL parameters change
  useEffect(() => {
    if (urlStep) {
      const newStep = parseInt(urlStep);
      try {
      console.log('URL step changed, updating currentStep from', currentStep, 'to', newStep);
      } catch {}
      setCurrentStep(newStep);
    }
  }, [urlStep, currentStep]);

  // Load public link data when on step 4
  useEffect(() => {
    if (currentStep === 4 && urlQuestionnaireId) {
      loadPublicLinkData(urlQuestionnaireId);
    }
  }, [currentStep, urlQuestionnaireId]);

  const loadPublicLinkData = async (questionnaireId: string) => {
    try {
      setPublicLinkLoading(true);
      
      const { data: questionnaire, error } = await supabase
        .from('questionnaires')
        .select('public_token, default_lang, is_published')
        .eq('id', questionnaireId)
        .single();

      if (error) {
        console.warn('Could not load public link data:', error);
        return;
      }

      setPublicLinkData({
        public_token: questionnaire.public_token,
        default_lang: questionnaire.default_lang || formData.language,
        is_published: questionnaire.is_published || false
      });
    } catch (err) {
      console.warn('Error loading public link data:', err);
    } finally {
      setPublicLinkLoading(false);
    }
  };

  const loadExistingQuestionnaire = async (questionnaireId: string) => {
    try {
    try {
      console.log('🚀 loadExistingQuestionnaire called with ID:', questionnaireId);
      } catch {}
      
      // Load questionnaire data
      const { data: questionnaire, error: qError } = await supabase
        .from('questionnaires')
        .select('*')
        .eq('id', questionnaireId)
        .single();

      if (qError) {
        console.error('❌ Error loading questionnaire:', qError);
        return;
      }

      try {
      console.log('✅ Questionnaire loaded:', questionnaire);
      } catch {}

      if (questionnaire) {
        // Load public link data
        setPublicLinkData({
          public_token: questionnaire.public_token,
          default_lang: questionnaire.default_lang || formData.language,
          is_published: questionnaire.is_published || false
        });
        
        // Load questions - try both order columns for compatibility
        let finalQuestions = [];
        const { data: questions, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('questionnaire_id', questionnaireId)
          .order('question_order', { ascending: true });

        if (questionsError) {
          console.error('❌ Error loading questions with question_order:', questionsError);
          // If question_order doesn't exist, try with created_at as fallback
          const { data: fallbackQuestions, error: fallbackError } = await supabase
            .from('questions')
            .select('*')
            .eq('questionnaire_id', questionnaireId)
            .order('created_at', { ascending: true });
          
          if (!fallbackError && fallbackQuestions) {
            try {
            console.log('✅ Questions loaded with fallback order:', fallbackQuestions);
            } catch {}
            finalQuestions = fallbackQuestions;
          } else {
            console.error('❌ Error loading questions with created_at fallback:', fallbackError);
            finalQuestions = [];
          }
        } else {
          try {
          console.log('✅ Questions loaded with question_order:', questions);
          } catch {}
          finalQuestions = questions || [];
        }

        // Load question options
        let allOptions = [];
        if (finalQuestions && finalQuestions.length > 0) {
          const questionIds = finalQuestions.map(q => q.id);
          const { data: options, error: optionsError } = await supabase
            .from('question_options')
            .select('*')
            .in('question_id', questionIds)
            .order('order_index', { ascending: true });

          if (optionsError) {
            console.error('❌ Error loading options:', optionsError);
          } else {
            try {
            console.log('✅ Options loaded:', options);
            } catch {}
            allOptions = options || [];
          }
        }

        // Extract design colors and other metadata
        const designColors = questionnaire.design_colors || {};
        const meta = questionnaire.meta || {};

        // Convert questions from database format to form format
        const convertedQuestions = (finalQuestions || []).map(q => {
          // Find options for this question
          const questionOptions = allOptions.filter(opt => opt.question_id === q.id);
          
          return {
            id: q.id,
            text: q.question_text || q.text || q.label || '',
            type: q.question_type || q.type || 'text',
            isRequired: q.is_required || q.required || q.isRequired || false,
            options: questionOptions.map(opt => ({
              value: opt.value,
              label: opt.label
            }))
          };
        });

        const newFormData = {
          id: questionnaire.id,
          title: questionnaire.title || '',
          questions: convertedQuestions,
          status: designColors.status || 'draft',
          language: designColors.language || language
        };

        try {
        console.log('🔄 Setting new form data:', newFormData);
        } catch {}
        setFormData(newFormData);

        setIsEditingExisting(true);
        try {
        console.log('✅ Loaded existing questionnaire data:', { questionnaire, questions });
        } catch {}
      }
    } catch (err) {
      console.error('❌ Error loading existing questionnaire:', err);
    }
  };

  const updateStep = (newStep: number) => {
    try {
    console.log('updateStep called with:', newStep);
    console.log('Current step before update:', currentStep);
    } catch {}
    
    setCurrentStep(newStep);
    
    // Update URL with new step
    const newSearchParams = new URLSearchParams(location.search);
    newSearchParams.set('step', newStep.toString());
    
    if (formData.id) {
      newSearchParams.set('id', formData.id);
    }
    
    const newUrl = `${location.pathname}?${newSearchParams.toString()}`;
    try {
    console.log('Navigating to new URL:', newUrl);
    } catch {}
    
    navigate(newUrl, { replace: true });
  };

  const handleNextFromProfile = async () => {
    if (!profileRef.current) return;

    // אם הטופס תקין ואין שינוי – מדלגים בלי לשמור
    const valid = profileRef.current.isValid();
    const dirty = profileRef.current.isDirty ? profileRef.current.isDirty() : true;

    if (valid && !dirty) {
      updateStep(2);
      return;
    }

    // אחרת – נשמור ורק אם הצליח נתקדם
    setSavingProfile(true);
    const ok = await profileRef.current.save();
    setSavingProfile(false);
    if (!ok) return;
    updateStep(2);
  };

  // שימוש בטבלת התחומים המרכזית

  const supportedLanguages = [
    { value: 'he', label: 'עברית', flag: '🇮🇱' },
    { value: 'en', label: 'English', flag: '🇺🇸' },
    { value: 'ar', label: 'العربية', flag: '🇸🇦' },
    { value: 'ru', label: 'Русский', flag: '🇷🇺' },
    { value: 'fr', label: 'Français', flag: '🇫🇷' },
    { value: 'es', label: 'Español', flag: '🇪🇸' }
  ];

  const questionTypes = [
    { value: 'text', label: language === 'he' ? 'טקסט חופשי' : 'Text', icon: '📝' },
    { value: 'single_choice', label: language === 'he' ? 'בחירה יחידה' : 'Single Choice', icon: '🔘' },
    { value: 'multiple_choice', label: language === 'he' ? 'בחירה מרובה' : 'Multiple Choice', icon: '☑️' },
    { value: 'rating', label: language === 'he' ? 'דירוג (1-5 כוכבים)' : 'Rating (1-5 stars)', icon: '⭐' },
    { value: 'date', label: language === 'he' ? 'תאריך' : 'Date', icon: '📅' },
    { value: 'audio', label: language === 'he' ? 'הקלטה קולית' : 'Audio Recording', icon: '🎤' },
    { value: 'conditional', label: language === 'he' ? 'שאלה מותנית' : 'Conditional Question', icon: '🔀' },
    { value: 'email', label: language === 'he' ? 'אימייל' : 'Email', icon: '📧' },
    { value: 'phone', label: language === 'he' ? 'טלפון' : 'Phone', icon: '📞' }
  ];

  const suggestedQuestions = {
    lawyer: language === 'he' ? [
      { text: 'איזה סוג של עניין משפטי אתם זקוקים לסיוע בו?', type: 'single_choice', options: ['דיני משפחה', 'דיני עבודה', 'דיני נזיקין', 'דיני מקרקעין', 'דיני חברות', 'אחר'] },
      { text: 'האם הייתם מעורבים במצב משפטי דומה בעבר?', type: 'single_choice', options: ['כן', 'לא', 'לא בטוח'] },
      { text: 'מה הדרך המועדפת עליכם לתקשורת?', type: 'multiple_choice', options: ['טלפון', 'אימייל', 'וואטסאפ', 'פגישה פנים אל פנים'] },
      { text: 'תארו בקצרה את המצב המשפטי שלכם', type: 'text' },
      { text: 'מתי תרצו לתזמן ייעוץ?', type: 'date' }
    ] : [
      { text: 'What type of legal matter do you need assistance with?', type: 'single_choice', options: ['Family Law', 'Employment Law', 'Personal Injury', 'Real Estate', 'Corporate Law', 'Other'] },
      { text: 'Have you been involved in a similar legal situation before?', type: 'single_choice', options: ['Yes', 'No', 'Not sure'] },
      { text: 'What is your preferred method of communication?', type: 'multiple_choice', options: ['Phone', 'Email', 'WhatsApp', 'In-person meeting'] },
      { text: 'Please briefly describe your legal situation', type: 'text' },
      { text: 'When would you like to schedule a consultation?', type: 'date' }
    ],
    coach: language === 'he' ? [
      { text: 'באיזה תחום בחיים שלכם תרצו להתמקד בשיפור?', type: 'single_choice', options: ['קריירה', 'יחסים', 'בריאות ורווחה', 'כספים', 'פיתוח אישי', 'אחר'] },
      { text: 'מה האתגר הגדול ביותר שלכם כעת?', type: 'text' },
      { text: 'האם עבדתם עם מאמן בעבר?', type: 'single_choice', options: ['כן', 'לא'] },
      { text: 'איך נראה הצלחה עבורכם?', type: 'text' },
      { text: 'דרגו את מוכנותכם לשינוי', type: 'rating' }
    ] : [
      { text: 'What area of your life would you like to focus on improving?', type: 'single_choice', options: ['Career', 'Relationships', 'Health & Wellness', 'Finances', 'Personal Development', 'Other'] },
      { text: 'What is your biggest challenge right now?', type: 'text' },
      { text: 'Have you worked with a coach before?', type: 'single_choice', options: ['Yes', 'No'] },
      { text: 'What does success look like to you?', type: 'text' },
      { text: 'Rate your readiness for change', type: 'rating' }
    ],
    insurance: language === 'he' ? [
      { text: 'איזה סוג של ביטוח אתם מחפשים?', type: 'multiple_choice', options: ['ביטוח חיים', 'ביטוח בריאות', 'ביטוח רכב', 'ביטוח דירה', 'ביטוח נסיעות', 'אחר'] },
      { text: 'האם יש לכם כיסוי ביטוח כרגע?', type: 'single_choice', options: ['כן', 'לא', 'חלקי'] },
      { text: 'מה התקציב החודשי המשוער שלכם?', type: 'single_choice', options: ['עד 200 ש"ח', '200-500 ש"ח', '500-1000 ש"ח', 'מעל 1000 ש"ח'] },
      { text: 'מתי אתם צריכים שהכיסוי יתחיל?', type: 'date' },
      { text: 'דרגו את חשיבות הביטוח עבורכם', type: 'rating' }
    ] : [
      { text: 'What type of insurance are you looking for?', type: 'multiple_choice', options: ['Life Insurance', 'Health Insurance', 'Auto Insurance', 'Home Insurance', 'Travel Insurance', 'Other'] },
      { text: 'Do you currently have insurance coverage?', type: 'single_choice', options: ['Yes', 'No', 'Partial'] },
      { text: 'What is your approximate monthly budget?', type: 'single_choice', options: ['Under $50', '$50-150', '$150-300', 'Over $300'] },
      { text: 'When do you need coverage to start?', type: 'date' },
      { text: 'Rate the importance of insurance to you', type: 'rating' }
    ],
    real_estate: language === 'he' ? [
      { text: 'איזה סוג של נכס אתם מחפשים?', type: 'single_choice', options: ['דירה למגורים', 'בית פרטי', 'השקעה', 'מסחרי', 'אחר'] },
      { text: 'באיזה אזור אתם מעוניינים?', type: 'text' },
      { text: 'מה תקציב הרכישה שלכם?', type: 'single_choice', options: ['עד 2 מיליון ש"ח', '2-4 מיליון ש"ח', '4-6 מיליון ש"ח', 'מעל 6 מיליון ש"ח'] },
      { text: 'מתי אתם מתכננים לרכוש?', type: 'single_choice', options: ['תוך חודש', 'תוך 3 חודשים', 'תוך 6 חודשים', 'אין לחץ זמן'] }
    ] : [
      { text: 'What type of property are you looking for?', type: 'single_choice', options: ['Residential Apartment', 'House', 'Investment Property', 'Commercial', 'Other'] },
      { text: 'Which area are you interested in?', type: 'text' },
      { text: 'What is your purchase budget?', type: 'single_choice', options: ['Under $500K', '$500K-1M', '$1M-2M', 'Over $2M'] },
      { text: 'When are you planning to purchase?', type: 'single_choice', options: ['Within a month', 'Within 3 months', 'Within 6 months', 'No time pressure'] }
    ]
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      text: '',
      type: 'text',
      isRequired: false
    };
    setFormData({
      ...formData,
      questions: [...formData.questions, newQuestion]
    });
  };

  const duplicateQuestion = (questionId: string) => {
    const questionToDuplicate = formData.questions.find(q => q.id === questionId);
    if (questionToDuplicate) {
      const duplicatedQuestion: Question = {
        ...questionToDuplicate,
        id: `q-${Date.now()}`,
        text: `${questionToDuplicate.text} (Copy)`
      };
      const questionIndex = formData.questions.findIndex(q => q.id === questionId);
      const newQuestions = [...formData.questions];
      newQuestions.splice(questionIndex + 1, 0, duplicatedQuestion);
      setFormData({
        ...formData,
        questions: newQuestions
      });
    }
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setFormData({
      ...formData,
      questions: formData.questions.map(q => 
        q.id === id ? { ...q, ...updates } : q
      )
    });
  };

  const removeQuestion = (id: string) => {
    setFormData({
      ...formData,
      questions: formData.questions.filter(q => q.id !== id)
    });
  };

  const generateAIOptions = async (questionId: string, questionText: string) => {
    if (!questionText.trim()) {
      safeToast(toast, 
        language === 'he' ? 'שגיאה' : 'Error',
        language === 'he' ? 'יש להזין טקסט שאלה תחילה' : 'Please enter question text first',
        'destructive'
      );
      return;
    }

    setIsGeneratingOptions(questionId);
    
    // Simulate AI generation - replace with actual AI call
    setTimeout(() => {
      const sampleOptions = language === 'he' 
        ? ['אפשרות מוצעת 1', 'אפשרות מוצעת 2', 'אפשרות מוצעת 3', 'אחר']
        : ['Suggested Option 1', 'Suggested Option 2', 'Suggested Option 3', 'Other'];
      
      updateQuestion(questionId, { options: sampleOptions });
      setIsGeneratingOptions(null);
      
      safeToast(toast, 
        language === 'he' ? 'אפשרויות נוצרו' : 'Options Generated',
        language === 'he' 
          ? 'נוצרו אפשרויות מוצעות בעזרת AI' 
          : 'AI-powered options have been generated'
      );
    }, 2000);
  };

  // הוסיפי למעלה בסקופ הקומפוננטה:
  const safeProfile =
    (typeof profile !== "undefined" && profile) || // אם יש משתנה כזה
    (typeof profileData !== "undefined" && profileData) ||
    (typeof currentProfile !== "undefined" && currentProfile) ||
    null;

  // helpers קטנים שנשים ליד שאר הפונקציות בקומפוננטה
  const makeId = () =>
    (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function')
      ? globalThis.crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  // ודאי שיש כותרת כלשהי כדי לא ליפול על ולידציה פנימית
  function ensureQuestionnaireTitle() {
    setFormData(prev => ({
      ...prev,
      title: (prev.title?.trim() || 'שאלון ללא כותרת'),
    }));
  }

  // אם אין אצלך safeProfile או שהוא ריק — נטען פרופיל מסופבייס ישירות
  type ProfileRow = {
    business_name?: string | null;
    occupation?: string | null;
    suboccupation?: string | null;
    other_text?: string | null;
    links?: { title?: string | null; url?: string | null }[] | null;
  };

  async function loadProfileFromSupabase(): Promise<ProfileRow | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('business_name, occupation, suboccupation, other_text, links')
        .eq('id', user.id)
        .single();
      if (error) return null;
      return data as ProfileRow;
    } catch {
      return null;
    }
  }

  async function onSuggestClick() {
    try {
      // לא ליפול על כותרת חסרה:
      ensureQuestionnaireTitle();

      // קחי פרופיל קיים אם יש, אחרת מה-DB
      const p: ProfileRow | null =
        (typeof safeProfile !== 'undefined' && safeProfile) || (await loadProfileFromSupabase());

      const businessName = p?.business_name || formData?.title || 'עסק';
      const occupation = p?.occupation || formData?.category || 'כללי';
      const suboccupation = p?.suboccupation || 'כללי';
      const otherText = p?.other_text || '—';
      const linksStr = Array.isArray(p?.links)
        ? p!.links
            .map(l => [l?.title, l?.url].filter(Boolean).join(' '))
            .filter(Boolean)
            .join(' | ')
        : '';

      const promptForCustomer = (occupation: string, sub: string, extra: string, links: string) => `
את/ה יועץ/ת UX וכתיבת שאלונים שיווקיים.
השאלון מוצג ללקוח הקצה (לא לבעל העסק). שאלות קצרות, ידידותיות, שמטרתן לאסוף צורך, דחיפות והעדפות — כדי שנוכל להתאים שירות ולהמיר לפנייה.

קלט:
- תחום תעסוקה: ${occupation || "כללי"}
- תת תחום/התמחות: ${sub || "כללי"}
- לינקים/מידע נוסף: ${extra || "—"}${links ? " | " + links : ""}

מטרה:
לבנות 5–7 שאלות ממוקדות ללקוח הקצה, שמקדמות התאמת שירות והמרה (ללא מסרים שיווקיים מוגזמים).

כללים:
1) לכל שאלה החזר אובייקט:
   - "text": ניסוח השאלה ללקוח.
   - "type": אחד מ["בחירה יחידה","בחירה מרובה","שדה טקסט חופשי","כן/לא"].
   - "options": אם type הוא בחירה—לפחות 3 אופציות קצרות וברורות; אחרת [].
2) ניסוח תכליתי, מותאם למובייל.
3) ללא הבטחות/סופרלטיבים; רק איסוף צרכים והעדפות שמקדמים התאמת שירות.
4) אם חסר מידע בקלט—ניסוח כללי אך רלוונטי לתחום.

פורמט פלט (חובה):
החזר אך ורק JSON תקין: מערך אובייקטים לפי הסכימה הבאה:
[
  {"text": "...", "type": "בחירה יחידה", "options": ["...", "...", "..."]},
  ...
]
`;

      const prompt = promptForCustomer(occupation, suboccupation, otherText, linksStr);

      console.log("[AI] prompt_override:", prompt.slice(0, 160));

      // קריאה לפונקציה בענן
      const suggestions = await fetchSuggestedQuestions({
        businessName,
        occupation,
        suboccupation,
        other_text: otherText,
        links: linksStr,
        language: 'he',
        max: 7,
        prompt_override: prompt,
        __debug: true, // לצורך בדיקה
      });

      // הזרקה ל-formData.questions (לא משתמשים ב-setQuestions שלא קיים)
      setFormData(prev => {
        const onlyDefaults =
          prev.questions.length <= 3 &&
          prev.questions.every((q: any) =>
            typeof q?.text === 'string' && /(שם|טלפון|נייד|מייל)/.test(q.text)
          );

        // תומך גם במערך מחרוזות וגם במערך אובייקטים {text,type,options}
        const aiBlocks = suggestions.map((q: any) => {
          const text = typeof q === 'string' ? q : (q?.text || '').toString();
          return {
            id: makeId(),
            type: 'text' as const,   // אם זמנית תומכים רק בשדה חופשי
            text,
            isRequired: false,
          };
        }).filter(block => block.text.trim());

        return {
          ...prev,
          questions: onlyDefaults ? aiBlocks : [...prev.questions, ...aiBlocks],
        };
      });
    } catch (e: any) {
      console.error('AI suggest failed:', e);
      alert('שגיאה בטעינת שאלות AI: ' + (e?.message || ''));
    }
  }

  // Profile saving is now handled by ProfileForm component

  const saveAsDraft = async () => {
    await onSaveDraft(formData.id, {
      title: formData.title,
      language: formData.language,
      status: 'draft'
    });
  };

  async function onSaveDraft(qid: string | undefined, partial?: Record<string, any>) {
    if (!qid) {
      safeToast(toast, "שגיאה", "לא ניתן לשמור טיוטה ללא מזהה שאלון.", "destructive");
      return;
    }
    try {
      // עדכון מינימלי (ללא שבירת DB): סטטוס/כותרת/שדות קיימים בלבד
      const updates = { status: "draft", ...(partial ?? {}) };
      const { error } = await supabase.from("questionnaires").update(updates).eq("id", qid);
      if (error) throw error;
      safeToast(toast, "נשמר", "הטיוטה נשמרה");
    } catch (e) {
      console.error(e);
      safeToast(toast, "שגיאה", "שמירת טיוטה נכשלה");
    }
  }

  const lockQuestionnaire = () => {
    setFormData({ ...formData, status: 'locked' });
    safeToast(toast, 
      language === 'he' ? 'השאלון נעול' : 'Questionnaire Locked',
      language === 'he' 
        ? 'השאלון נעול ולא ניתן לערוך אותו יותר'
        : 'Questionnaire is locked and cannot be edited anymore'
    );
  };

  // פונקציות חדשות לכפתורים שעובדים
  const handleSaveDraftAndGoList = async () => {
    try {
      // שמירת השאלון כטיוטה
      setFormData({ ...formData, status: 'draft' });
      
      // ניווט לרשימת השאלונים
      navigate(routes.questionnaires);
      
      safeToast(toast, 
        language === 'he' ? 'נשמר כטיוטה' : 'Saved as Draft',
        language === 'he' 
          ? 'השאלון נשמר כטיוטה ועברת לרשימת השאלונים'
          : 'Questionnaire saved as draft and moved to questionnaires list'
      );
    } catch (error) {
      console.error('Error saving draft:', error);
      safeToast(toast,
        language === 'he' ? 'שגיאה' : 'Error',
        language === 'he' 
          ? 'שגיאה בשמירת הטיוטה'
          : 'Error saving draft',
        'destructive'
      );
    }
  };

  const handlePublishAndGoReview = async () => {
    try {
    try {
      console.log('handlePublishAndGoReview called, formData:', formData);
      } catch {}
      
      // שמירת השאלון כמוכן לפרסום
      setFormData({ ...formData, status: 'ready' });
      
      // אם יש ID, עבור ישירות לסקירה
      if (formData.id) {
        try {
        console.log('Questionnaire has ID, navigating to review:', formData.id);
        } catch {}
        // עדיפות ל-public_token אם קיים
        const qid = formData.id;
        navigate(routes.distributeHub);
      } else {
        try {
        console.log('No ID, using handleSaveAndNavigate...');
        } catch {}
        // השתמש בפונקציה הקיימת שעובדת
        await handleSaveAndNavigate();
      }
      
      safeToast(toast, 
        language === 'he' ? 'מוכן לפרסום' : 'Ready for Publishing',
        language === 'he' 
          ? 'השאלון מוכן לפרסום ועברת לסקירה'
          : 'Questionnaire ready for publishing and moved to review'
      );
    } catch (error) {
      console.error('Error preparing for publishing:', error);
      safeToast(toast,
        language === 'he' ? 'שגיאה' : 'Error',
        language === 'he' 
          ? 'שגיאה בהכנת השאלון לפרסום'
          : 'Error preparing questionnaire for publishing',
        'destructive'
      );
    }
  };

  const duplicateToLanguage = (targetLanguage: string) => {
    const languageLabel = supportedLanguages.find(l => l.value === targetLanguage)?.label || targetLanguage;
    const duplicatedQuestionnaire = {
      ...formData,
      id: undefined,
      language: targetLanguage,
      title: `${formData.title} (${languageLabel})`
    };
    
    safeToast(toast, 
      language === 'he' ? 'שכפול בוצע' : 'Duplication Complete',
      language === 'he' 
        ? `השאלון שוכפל ל${languageLabel}`
        : `Questionnaire duplicated to ${languageLabel}`
    );
  };

  const addOptionToQuestion = (questionId: string) => {
    const question = formData.questions.find(q => q.id === questionId);
    if (question && (question.type === 'single_choice' || question.type === 'multiple_choice')) {
      const newOptions = [...(question.options || []), language === 'he' ? 'אפשרות חדשה' : 'New Option'];
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const removeOptionFromQuestion = (questionId: string, optionIndex: number) => {
    const question = formData.questions.find(q => q.id === questionId);
    if (question && question.options) {
      const newOptions = question.options.filter((_, index) => index !== optionIndex);
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const updateOptionInQuestion = (questionId: string, optionIndex: number, newValue: string) => {
    const question = formData.questions.find(q => q.id === questionId);
    if (question && question.options) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = newValue;
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const handleFinish = async () => {
    if (!formData.title.trim() || formData.questions.length === 0) {
      const missing: string[] = [];
      if (!formData.title.trim()) missing.push(language==='he'?'כותרת השאלון':'Title');
      if (formData.questions.length === 0) missing.push(language==='he'?'לפחות שאלה אחת':'At least one question');
      safeToast(toast,
        language === 'he' ? 'שגיאה' : 'Error',
        (language==='he'
          ? `שדות חסרים: ${missing.join(', ')}. ודאו שקיימת לפחות שאלה אחת (מומלץ לסמן אותה כחובה).`
          : `Missing fields: ${missing.join(', ')}. Ensure at least one question (preferably marked required).`),
        'destructive'
      );
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      // התאמה מלאה לסכמה: questionnaires (title, user_id)
      const insertPayload:any = {
        title: formData.title,
        user_id: user?.id || null,
      };
      let { data: qRow, error: qErr } = await supabase
        .from('questionnaires')
        .insert(insertPayload)
        .select('id')
        .single();

      // טיפול בכשל FK (אין שורה תואמת בטבלת public.users)
      if (qErr && /questionnaires_user_id_fkey/i.test(qErr.message || '')) {
        const withoutUser = { ...insertPayload };
        delete withoutUser.user_id;
        const retry = await supabase
          .from('questionnaires')
          .insert(withoutUser)
          .select('id')
          .single();
        qRow = retry.data as any;
        qErr = retry.error as any;
      }

      if (qErr) throw qErr;

      // שמירת שאלות בטבלת questions עם כל השדות הנדרשים
      const qid = qRow?.id;
      if (qid && formData.questions?.length) {
        const records = formData.questions
          .filter(q => (q.text || '').trim().length > 0)
          .map((q, index) => ({ 
            question_text: q.text, 
            questionnaire_id: qid, 
            is_active: true,
            question_type: q.type,
            is_required: q.isRequired,
            question_order: index + 1
          }));
        if (records.length) {
          const { error: qe } = await supabase.from('questions').insert(records);
          if (qe) console.warn('questions insert warning:', qe.message);
        }
      }

      // יצירת כותרת כשאלה ראשונה אם חסרה במבנה – לא לגעת בשאלות קיימות
      if (qid) {
        const hasTitleQuestion = formData.questions.some(q => (q.text||'').trim() === formData.title.trim());
        if (!hasTitleQuestion && formData.title.trim()) {
          await supabase.from('questions').insert({
            question_text: formData.title.trim(),
            questionnaire_id: qid,
            is_active: true
          });
        }
      }

      safeToast(toast, 
        language==='he' ? 'השאלון נשמר' : 'Questionnaire saved',
        language==='he' ? 'השאלון נשמר בהצלחה בבסיס הנתונים' : 'Saved to database successfully'
      );
    } catch (e:any) {
      console.error('Supabase insert failed:', e?.message || e);
      safeToast(
        toast,
        language === "he"
          ? "שמירה ל-Supabase נכשלה. ודאי שמדיניות RLS קיימת ושיש רשומת משתמש בטבלת profiles/public.users."
          : "Saving to Supabase failed. Ensure RLS policies exist and there's a user row in profiles/public.users.",
        undefined,
        "destructive"
      );
    }

    safeToast(toast, 
      language === 'he' ? 'השאלון נוצר בהצלחה!' : 'Questionnaire Created Successfully!',
      language === 'he' 
        ? `נוצר שאלון חדש עם ${formData.questions.length} שאלות`
        : `Created new questionnaire with ${formData.questions.length} questions`
    );
    navigate(routes.questionnaires);
  };

  const handleSaveAndNavigate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        safeToast(toast,
          language === 'he' ? 'יש להתחבר כדי לשמור' : 'Please login to save',
          'Please login to save',
          'destructive'
        );
        return;
      }

      // Save questionnaire first
      const questionnaireData = {
        title: formData.title || 'שאלון ללא כותרת',
        language: formData.language,
        status: 'draft',
        user_id: user.id
      };

      const { data: questionnaire, error: qError } = await supabase
        .from('questionnaires')
        .insert(questionnaireData)
        .select()
        .single();

      if (qError) throw qError;

      // Save questions with proper structure
      const questionsData = formData.questions.map((q, index) => ({
        questionnaire_id: questionnaire.id,
        question_text: q.text,
        is_active: true,
        question_type: q.type,
        is_required: q.isRequired,
        question_order: index + 1
      }));

      const { data: savedQuestions, error: questionsError } = await supabase
        .from('questions')
        .insert(questionsData)
        .select();

      if (questionsError) throw questionsError;

      // Save question options separately if they exist
      if (savedQuestions && savedQuestions.length > 0) {
        const optionsData = [];
        for (let i = 0; i < savedQuestions.length; i++) {
          const question = savedQuestions[i];
          const originalQuestion = formData.questions[i];
          
          if (originalQuestion.options && originalQuestion.options.length > 0) {
            const questionOptions = originalQuestion.options.map((option, optionIndex) => ({
              question_id: question.id,
              value: option.value || option,
              label: option.label || option,
              order_index: optionIndex + 1
            }));
            optionsData.push(...questionOptions);
          }
        }

        if (optionsData.length > 0) {
          const { error: optionsError } = await supabase
            .from('question_options')
            .insert(optionsData);

          if (optionsError) {
            console.warn('Warning: Could not save question options:', optionsError);
            // Don't throw error for options, just log warning
          }
        }
      }

      // Update formData with the new ID
      setFormData(prev => ({ ...prev, id: questionnaire.id }));
      
      safeToast(toast, 
        language === 'he' ? 'השאלון נשמר בהצלחה' : 'Questionnaire saved successfully',
        language === 'he' ? 'מעביר לדף הסקירה...' : 'Redirecting to review...'
      );

      // Navigate to review page
      setTimeout(() => {
        const reviewUrl = routes.questionnaireReviewById(questionnaire.token || questionnaire.id);
        try {
        console.log('Navigating to review after save:', reviewUrl);
        } catch {}
        navigate(reviewUrl);
      }, 1000);

    } catch (error: any) {
      console.error('Save error:', error);
      safeToast(toast,
        language === 'he' ? 'שגיאה בשמירה' : 'Save Error',
        error.message || (language === 'he' ? 'לא ניתן היה לשמור את השאלון' : 'Could not save questionnaire'),
        'destructive'
      );
    }
  };

  const steps = [
    {
      title: language === 'he' ? 'פרופיל ומיתוג' : 'Profile & Branding',
      description: language === 'he' ? 'פרטי החברה, קטגוריה ומיתוג' : 'Company details, category and branding'
    },
    {
      title: language === 'he' ? 'בניית שאלות' : 'Question Builder',
      description: language === 'he' ? 'יצירה ועריכה של שאלות' : 'Create and edit questions'
    },
    {
      title: language === 'he' ? 'סקירה ופרסום' : 'Review & Publish',
      description: language === 'he' ? 'בדיקה סופית והגדרות הפצה' : 'Final review and distribution settings'
    },
    {
      title: language === 'he' ? 'עיצוב ותצוגה מקדימה' : 'Design & Preview',
      description: language === 'he' ? 'התאמה אישית ותצוגה מקדימה' : 'Customization and preview'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6" dir={language === 'he' ? 'rtl' : 'ltr'}>
      {/* Progress Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-primary">
          {language === 'he' ? 'יצירת שאלון חדש' : 'Create New Questionnaire'}
        </h1>
        <div className="flex items-center justify-center gap-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index + 1 <= currentStep 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {index + 1}
              </div>
              <span className={`text-sm ${
                index + 1 <= currentStep ? 'text-primary font-medium' : 'text-muted-foreground'
              }`}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground mx-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Hoogi Guidance */}
      <HoogiMessage 
        message={
          currentStep === 1 
            ? (language === 'he' ? 'שלום! בואו נתחיל ביצירת השאלון שלכם. תחילה נגדיר את פרטי החברה והמיתוג.' : 'Hello! Let\'s start creating your questionnaire. First, we\'ll set up your company details and branding.')
            : currentStep === 2
            ? (language === 'he' ? 'כעת נבנה את השאלות. תוכלו להוסיף שאלות ידנית או להשתמש בשאלות מוצעות לפי הקטגוריה שבחרתם.' : 'Now let\'s build the questions. You can add questions manually or use suggested questions based on your selected category.')
            : (language === 'he' ? 'מעולה! כעת תוכלו לראות תצוגה מקדימה של השאלון ולהתאים את העיצוב.' : 'Great! Now you can preview your questionnaire and customize the design.')
        }
      />

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {steps[currentStep - 1].title}
            {currentStep === 1 && <Settings className="h-5 w-5 text-primary" />}
            {currentStep === 2 && <Users className="h-5 w-5 text-primary" />}
            {currentStep === 3 && <Zap className="h-5 w-5 text-primary" />}
            {currentStep === 4 && <Eye className="h-5 w-5 text-primary" />}
          </CardTitle>
          <CardDescription>{steps[currentStep - 1].description}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Profile & Business Setup */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <ProfileForm 
                ref={profileRef} 
                mode="onboarding" 
                toast={toast}
                onSaved={(success) => {
                  try {
                  console.log("Profile save result:", success);
                  } catch {}
                  if (success) {
                    try {
                    console.log("Moving to step 2...");
                    } catch {}
                  }
                }} 
              />
            </div>
          )}

          {/* Step 2: Question Builder */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Header with suggested questions + questionnaire title */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold text-primary">
                    {language === 'he' ? 'בניית שאלות' : 'Question Builder'}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <TooltipWrapper content={language === 'he' ? 'טען שאלות מוצעות לקטגוריה' : 'Load suggested questions for category'}>
                    <Button
                      variant="secondary"
                      onClick={onSuggestClick}
                      disabled={!hasValidCategory()}
                      className="gap-2"
                    >
                      <Zap className="h-4 w-4" />
                      {language === 'he' ? 'שאלות מוצעות' : 'Load Suggested'}
                    </Button>
                  </TooltipWrapper>
                  
                  <TooltipWrapper content={language === 'he' ? 'הוסף שאלה חדשה' : 'Add new question'}>
                    <Button onClick={addQuestion} className="gap-2">
                      <Plus className="h-4 w-4" />
                      {language === 'he' ? 'הוסף שאלה' : 'Add Question'}
                    </Button>
                  </TooltipWrapper>

                  {/* Questionnaire Title field (placed to the right of the buttons) */}
                  <div className="flex items-center gap-2 ms-2">
                    <Label htmlFor="questionnaireTitle" className="whitespace-nowrap text-sm">
                      {language === 'he' ? 'כותרת השאלון' : 'Questionnaire Title'}
                    </Label>
                    <Input
                      id="questionnaireTitle"
                      aria-label={language === 'he' ? 'כותרת השאלון' : 'Questionnaire Title'}
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder={language === 'he' ? 'הקלד כותרת' : 'Enter title'}
                      className="w-56 sm:w-72"
                    />
                  </div>
                </div>
              </div>

              {/* Category reminder */}
              {!hasValidCategory() && (
                <div className="bg-secondary/20 border border-secondary/40 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-secondary-foreground">
                    <span className="text-lg">⚠️</span>
                    <span>
                      {language === 'he' 
                        ? 'יש לבחור קטגוריה עסקית בשלב הראשון כדי לקבל שאלות מוצעות'
                        : 'Please select a business category in step 1 to get suggested questions'
                      }
                    </span>
                  </div>
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-4">
                {formData.questions.map((question, index) => (
                  <Card key={question.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4 space-y-4">
                      {/* Question Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-primary/10">Q{index + 1}</Badge>
                          {question.isRequired && (
                            <Badge variant="destructive" className="text-xs">
                              {language === 'he' ? 'חובה' : 'Required'}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {questionTypes.find(t => t.value === question.type)?.icon} {questionTypes.find(t => t.value === question.type)?.label}
                          </span>
                        </div>
                        
                        {/* Question Actions */}
                        <div className="flex items-center gap-1">
                          <TooltipWrapper content={language === 'he' ? 'שכפל שאלה' : 'Duplicate question'}>
                            <Button variant="ghost" size="sm" onClick={() => duplicateQuestion(question.id)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipWrapper>
                          <TooltipWrapper content={language === 'he' ? 'מחק שאלה' : 'Delete question'}>
                            <Button variant="ghost" size="sm" onClick={() => removeQuestion(question.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TooltipWrapper>
                          <Button variant="ghost" size="sm" className="cursor-move">
                            <GripVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Question Text */}
                      <div className="space-y-2">
                        <Label htmlFor={`question-${question.id}`}>
                          {language === 'he' ? 'טקסט השאלה' : 'Question Text'}
                        </Label>
                        <Textarea
                          id={`question-${question.id}`}
                          value={question.text}
                          onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                          placeholder={language === 'he' ? 'הזן את השאלה...' : 'Enter your question...'}
                          className="min-h-[80px]"
                        />
                      </div>

                      {/* Question Type and Settings */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`type-${question.id}`}>
                            {language === 'he' ? 'סוג השאלה' : 'Question Type'}
                          </Label>
                          <Select
                            value={question.type}
                            onValueChange={(value) => updateQuestion(question.id, { 
                              type: value as QuestionType,
                              options: ['single_choice', 'multiple_choice'].includes(value) ? [language === 'he' ? 'אפשרות 1' : 'Option 1'] : undefined
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {questionTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center gap-2">
                                    <span>{type.icon}</span>
                                    <span>{type.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>{language === 'he' ? 'הגדרות' : 'Settings'}</Label>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`required-${question.id}`}
                                checked={question.isRequired}
                                onCheckedChange={(checked) => updateQuestion(question.id, { isRequired: !!checked })}
                              />
                              <Label htmlFor={`required-${question.id}`} className="text-sm">
                                {language === 'he' ? 'שאלה חובה' : 'Required'}
                              </Label>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Options for Choice Questions */}
                      {(question.type === 'single_choice' || question.type === 'multiple_choice') && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>{language === 'he' ? 'אפשרויות תשובה' : 'Answer Options'}</Label>
                            <div className="flex gap-2">
                              <TooltipWrapper content={language === 'he' ? 'יצר אפשרויות עם AI' : 'Generate options with AI'}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => generateAIOptions(question.id, question.text)}
                                  disabled={isGeneratingOptions === question.id || !question.text.trim()}
                                  className="gap-1"
                                >
                                  <Zap className="h-3 w-3" />
                                  {isGeneratingOptions === question.id ? '...' : 'AI'}
                                </Button>
                              </TooltipWrapper>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addOptionToQuestion(question.id)}
                                className="gap-1"
                              >
                                <Plus className="h-3 w-3" />
                                {language === 'he' ? 'הוסף' : 'Add'}
                              </Button>
                            </div>
                          </div>
                          
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {question.options?.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground w-8">
                                  {question.type === 'single_choice' ? '○' : '☐'}
                                </span>
                                <Input
                                  value={option}
                                  onChange={(e) => updateOptionInQuestion(question.id, optionIndex, e.target.value)}
                                  placeholder={language === 'he' ? 'טקסט האפשרות' : 'Option text'}
                                  className="flex-1"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeOptionFromQuestion(question.id, optionIndex)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Conditional Logic */}
                      {question.type === 'conditional' && (
                        <div className="space-y-2 bg-muted/50 p-3 rounded-lg">
                          <Label>{language === 'he' ? 'תנאי הצגה' : 'Display Condition'}</Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <Select
                              value={question.conditionalLogic?.parentQuestionId || ''}
                              onValueChange={(value) => updateQuestion(question.id, {
                                conditionalLogic: { ...question.conditionalLogic, parentQuestionId: value } as any
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={language === 'he' ? 'בחר שאלה' : 'Select question'} />
                              </SelectTrigger>
                              <SelectContent>
                                {formData.questions.filter(q => q.id !== question.id).map((q, idx) => (
                                  <SelectItem key={q.id} value={q.id}>Q{idx + 1}: {q.text.substring(0, 30)}...</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              value={question.conditionalLogic?.triggerValue || ''}
                              onChange={(e) => updateQuestion(question.id, {
                                conditionalLogic: { ...question.conditionalLogic, triggerValue: e.target.value } as any
                              })}
                              placeholder={language === 'he' ? 'ערך הפעלה' : 'Trigger value'}
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {formData.questions.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">
                      {language === 'he' ? 'עדיין לא נוספו שאלות' : 'No questions added yet'}
                    </p>
                    <p className="text-sm">
                      {language === 'he' ? 'לחץ על "הוסף שאלה" או "שאלות מוצעות" כדי להתחיל' : 'Click "Add Question" or "Load Suggested" to get started'}
                    </p>
                  </div>
                )}

                {/* Save Draft Button */}
                {formData.questions.length > 0 && (
                  <div className="flex justify-center pt-6 border-t">
                    <Button
                      onClick={saveAsDraft}
                      className="gap-2"
                      variant="outline"
                    >
                      <Save className="h-4 w-4" />
                      {language === 'he' ? 'שמור טיוטה' : 'Save Draft'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Review & Publish */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold text-primary">
                    {language === 'he' ? 'סקירה ופרסום' : 'Review & Publish'}
                  </span>
                </div>
              </div>
              
              <div className="text-center py-8 bg-muted/50 rounded-lg">
                <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {language === 'he' ? 'שלב הסקירה והפרסום' : 'Review & Publish Stage'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {language === 'he' 
                    ? 'בחר מה לעשות עם השאלון שלך'
                    : 'Choose what to do with your questionnaire'
                  }
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {/* כפתור שמור טיוטה */}
                  <Button 
                    onClick={handleSaveDraftAndGoList}
                    variant="outline"
                    className="gap-2 px-6 py-3"
                  >
                    <Save className="h-4 w-4" />
                    {language === 'he' ? 'שמור טיוטה → שאלונים' : 'Save Draft → Questionnaires'}
                  </Button>
                  
                  {/* כפתור עבור להפצה */}
                  <Button 
                    onClick={() => {
                      if (formData.id) {
                        // עדיפות ל-public_token אם קיים
                        const qid = formData.id;
                        navigate(routes.distributeHub);
                      } else {
                        // אם אין ID, שמור קודם ואז עבור להפצה
                        handleSaveAndNavigate().then(() => {
                          if (formData.id) {
                            // עדיפות ל-public_token אם קיים
                            const qid = formData.id;
                            navigate(routes.distributeHub);
                          }
                        });
                      }
                    }}
                    className="gap-2 px-6 py-3"
                    style={{ 
                      backgroundColor: formData.primaryColor, 
                      color: 'white',
                      border: 'none'
                    }}
                  >
                    {language === 'he' ? 'עבור להפצה' : 'Go to Distribution'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Design & Preview */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold text-primary">
                    {language === 'he' ? 'עיצוב ותצוגה מקדימה' : 'Design & Preview'}
                  </span>
                </div>
                
                {/* Language Duplication */}
                <div className="flex flex-wrap gap-2">
                  <Select onValueChange={duplicateToLanguage}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder={language === 'he' ? 'שכפל לשפה אחרת' : 'Duplicate to language'} />
                    </SelectTrigger>
                    <SelectContent>
                      {supportedLanguages.filter(lang => lang.value !== formData.language).map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          <div className="flex items-center gap-2">
                            <span>{lang.flag}</span>
                            <span>{lang.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                    className="gap-2"
                  >
                    {isPreviewMode ? <RotateCcw className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {isPreviewMode 
                      ? (language === 'he' ? 'חזרה לעריכה' : 'Back to Edit')
                      : (language === 'he' ? 'תצוגה מקדימה' : 'Preview Mode')
                    }
                  </Button>
                </div>
              </div>

              {/* Status Management */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    {language === 'he' ? 'סטטוס השאלון:' : 'Questionnaire Status:'}
                  </span>
                  <Badge variant={
                    formData.status === 'draft' ? 'secondary' : 
                    formData.status === 'locked' ? 'destructive' : 'default'
                  }>
                    {formData.status === 'draft' && (language === 'he' ? 'טיוטה' : 'Draft')}
                    {formData.status === 'locked' && (language === 'he' ? 'נעול' : 'Locked')}
                    {formData.status === 'pending' && (language === 'he' ? 'ממתין לאישור' : 'Pending')}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <TooltipWrapper content={language === 'he' ? 'שמור כטיוטה' : 'Save as draft'}>
                    <Button variant="outline" onClick={saveAsDraft} className="gap-2">
                      <Save className="h-4 w-4" />
                      {language === 'he' ? 'שמור טיוטה' : 'Save Draft'}
                    </Button>
                  </TooltipWrapper>
                  
                  <TooltipWrapper content={language === 'he' ? 'נעל שאלון (לא ניתן לעריכה)' : 'Lock questionnaire (cannot be edited)'}>
                    <Button variant="destructive" onClick={lockQuestionnaire} className="gap-2">
                      <Lock className="h-4 w-4" />
                      {language === 'he' ? 'נעל שאלון' : 'Lock'}
                    </Button>
                  </TooltipWrapper>
                </div>
              </div>

              {/* Public Link Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    {language === 'he' ? 'קישור ציבורי' : 'Public Link'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'he' 
                      ? 'קישור לשיתוף השאלון עם הציבור' 
                      : 'Link to share the questionnaire with the public'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {publicLinkLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {language === 'he' ? 'טוען...' : 'Loading...'}
                      </p>
                    </div>
                  ) : !publicLinkData?.public_token ? (
                    <div className="text-center py-4">
                      <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">
                        {language === 'he' ? 'אין קישור—פרסמי קודם' : 'No link—publish first'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={buildPublicUrl(publicLinkData.public_token, publicLinkData.default_lang as 'he' | 'en')}
                          readOnly
                          className="flex-1"
                        />
                        <Button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(
                                buildPublicUrl(publicLinkData.public_token!, publicLinkData.default_lang as 'he' | 'en')
                              );
                              safeToast(toast, 
                                language === 'he' ? 'הועתק!' : 'Copied!',
                                language === 'he' ? 'הקישור הועתק ללוח' : 'Link copied to clipboard'
                              );
                            } catch (err) {
                              safeToast(toast, 
                                language === 'he' ? 'שגיאה' : 'Error',
                                language === 'he' ? 'לא ניתן היה להעתיק את הקישור' : 'Could not copy the link',
                                'destructive'
                              );
                            }
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          {language === 'he' ? 'העתק' : 'Copy'}
                        </Button>
                        <Button
                          onClick={() => setShowQRModal(true)}
                          variant="outline"
                          size="sm"
                        >
                          <QrCode className="h-4 w-4 mr-2" />
                          {language === 'he' ? 'QR Code' : 'QR Code'}
                        </Button>
                      </div>
                      {publicLinkData.is_published && (
                        <div className="text-sm text-green-600 text-center">
                          {language === 'he' ? '✅ השאלון פורסם וזמין לציבור' : '✅ Questionnaire is published and available to the public'}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Live Preview */}
              <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border-2 border-primary/20 p-8 shadow-lg">
                <div className="max-w-3xl mx-auto space-y-8">
                  {/* Professional Header with Logo and Branding */}
                  <div className="text-center space-y-4 pb-6 border-b border-gray-200">
                    {formData.logoUrl && (
                      <div className="flex justify-center">
                        <div className="p-4 bg-white rounded-full shadow-md border border-gray-100">
                          <img 
                            src={formData.logoUrl} 
                            alt="Company Logo" 
                            className="h-20 w-20 object-contain"
                          />
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <h1 
                        className="text-3xl font-bold tracking-tight" 
                        style={{ color: formData.primaryColor }}
                      >
                        {formData.title || (language === 'he' ? 'כותרת השאלון' : 'Questionnaire Title')}
                      </h1>
                      {formData.companyName && (
                        <p className="text-lg font-medium text-gray-600">
                          {formData.companyName}
                        </p>
                      )}
                      {formData.category && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
                          <span className="text-sm font-medium text-gray-700">
                            {categories.find(cat => cat.value === formData.category)?.icon || '📋'}
                          </span>
                          <span className="text-sm text-gray-600">
                            {categories.find(cat => cat.value === formData.category)?.label || formData.category}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Welcome Message */}
                  <div className="text-center py-4">
                    <p className="text-gray-600 text-lg leading-relaxed">
                      {language === 'he' 
                        ? 'אנא השב על השאלות הבאות כדי שנוכל לשרת אותך בצורה הטובה ביותר'
                        : 'Please answer the following questions so we can serve you in the best way possible'
                      }
                    </p>
                  </div>

                  {/* Enhanced Questions Preview */}
                  <div className="space-y-6">
                    {formData.questions.map((question, index) => (
                      <Card 
                        key={question.id} 
                        className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
                        style={{ 
                          borderLeft: `4px solid ${formData.primaryColor}`,
                          backgroundColor: 'white'
                        }}
                      >
                        <CardContent className="p-6 space-y-4">
                          <div className="flex items-start gap-4">
                            {/* Question Number Badge */}
                            <div 
                              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm"
                              style={{ backgroundColor: formData.primaryColor }}
                            >
                              {index + 1}
                            </div>
                            
                            <div className="flex-1 space-y-3">
                              {/* Question Text */}
                              <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-gray-900 leading-relaxed">
                                  {question.text || (language === 'he' ? 'טקסט השאלה' : 'Question text')}
                                </h3>
                                {question.isRequired && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-full">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                    {language === 'he' ? 'שדה חובה' : 'Required'}
                                  </span>
                                )}
                              </div>

                              {/* Enhanced Question Input Preview */}
                              <div className="space-y-3">
                                {question.type === 'text' && (
                                  <Input 
                                    placeholder={language === 'he' ? 'הזן תשובה...' : 'Enter your answer...'} 
                                    disabled 
                                    className="h-12 text-base border-gray-300 focus:border-primary focus:ring-primary/20"
                                  />
                                )}
                                {question.type === 'email' && (
                                  <Input 
                                    type="email" 
                                    placeholder={language === 'he' ? 'כתובת אימייל' : 'Email address'} 
                                    disabled 
                                    className="h-12 text-base border-gray-300 focus:border-primary focus:ring-primary/20"
                                  />
                                )}
                                {question.type === 'phone' && (
                                  <Input 
                                    type="tel" 
                                    placeholder={language === 'he' ? 'מספר טלפון' : 'Phone number'} 
                                    disabled 
                                    className="h-12 text-base border-gray-300 focus:border-primary focus:ring-primary/20"
                                  />
                                )}
                                {question.type === 'single_choice' && question.options && (
                                  <div className="space-y-3">
                                    {question.options.map((option, optIndex) => (
                                      <label key={optIndex} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary/30 hover:bg-gray-50 cursor-pointer transition-colors">
                                        <input 
                                          type="radio" 
                                          disabled 
                                          name={`preview-${question.id}`}
                                          className="w-4 h-4 text-primary border-gray-300 focus:ring-primary/20"
                                        />
                                        <span className="text-base text-gray-700">{option}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                                {question.type === 'multiple_choice' && question.options && (
                                  <div className="space-y-3">
                                    {question.options.map((option, optIndex) => (
                                      <label key={optIndex} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary/30 hover:bg-gray-50 cursor-pointer transition-colors">
                                        <input 
                                          type="checkbox" 
                                          disabled
                                          className="w-4 h-4 text-primary border-gray-300 focus:ring-primary/20 rounded"
                                        />
                                        <span className="text-base text-gray-700">{option}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                                {question.type === 'rating' && (
                                  <div className="flex gap-2 justify-center py-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star 
                                        key={star} 
                                        className="h-8 w-8 text-gray-300 hover:text-yellow-400 cursor-pointer transition-colors" 
                                        fill="currentColor"
                                      />
                                    ))}
                                  </div>
                                )}
                                {question.type === 'date' && (
                                  <Input 
                                    type="date" 
                                    disabled 
                                    className="h-12 text-base border-gray-300 focus:border-primary focus:ring-primary/20"
                                  />
                                )}
                                {question.type === 'audio' && (
                                  <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                                    <div 
                                      className="w-12 h-12 rounded-full flex items-center justify-center shadow-md"
                                      style={{ backgroundColor: formData.primaryColor }}
                                    >
                                      <Mic className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-900">
                                        {language === 'he' ? 'הקלטה קולית' : 'Audio Recording'}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        {language === 'he' ? 'לחץ להקלטה' : 'Click to record'}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                {question.type === 'conditional' && (
                                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <span className="text-blue-600">ℹ️</span>
                                      <span className="text-sm text-blue-800">
                                        {language === 'he' 
                                          ? 'שאלה מותנית - תוצג בהתאם לתשובה קודמת' 
                                          : 'Conditional question - shown based on previous answer'
                                        }
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {formData.questions.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <Eye className="h-16 w-16 mx-auto mb-4 opacity-30" />
                        <p className="text-lg">
                          {language === 'he' ? 'לא נוספו שאלות עדיין' : 'No questions added yet'}
                        </p>
                        <p className="text-sm mt-2">
                          {language === 'he' 
                            ? 'הוסף שאלות כדי לראות תצוגה מקדימה' 
                            : 'Add questions to see preview'
                          }
                        </p>
                      </div>
                    )}
                  </div>


                </div>
              </div>
            </div>
          )}
        </CardContent>

        {/* Navigation */}
        <div className="flex justify-between p-6 border-t">
          <Button
            variant="outline"
            onClick={() => updateStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {language === 'he' ? 'קודם' : 'Previous'}
          </Button>

          {currentStep < 4 ? (
            <Button
              onClick={currentStep === 1 ? handleNextFromProfile : () => updateStep(Math.min(4, currentStep + 1))}
              disabled={savingProfile}
              className="gap-2"
            >
              {language === 'he' ? 'הבא' : 'Next'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleFinish} className="gap-2">
              <Save className="h-4 w-4" />
              {language === 'he' ? 'סיום ושמירה' : 'Finish & Save'}
            </Button>
          )}
        </div>
      </Card>

      {/* QR Modal */}
      <QRModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        value={publicLinkData?.public_token ? buildPublicUrl(publicLinkData.public_token, publicLinkData.default_lang as 'he' | 'en') : ''}
        title={language === 'he' ? 'QR Code' : 'QR Code'}
      />
    </div>
  );
};