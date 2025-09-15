import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProfile, type Profile } from "@/services/profileService";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Settings2, 
  Save, 
  Eye, 
  ArrowLeft, 
  GripVertical,
  Smartphone,
  Monitor,
  Sparkles,
  Copy,
  Share,
  Zap,
  Wand2,
  Heart,
  Clock,
  Check,
  Link,
  MessageSquare,
  Mail,
  Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { HoogiMessage } from '@/components/HoogiMascot';
import { TooltipWrapper } from '@/components/TooltipWrapper';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDemo, getDemoData } from '@/contexts/DemoContext';
import { useToast } from '@/hooks/use-toast';
import { toast as globalToast, announce } from '@/components/ui/Toaster';

interface Question {
  id: string;
  text: string;
  type: string;
  required: boolean;
  options?: string[];
  defaultAnswer: string;
  placeholder?: string;
  helpText?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

interface SortableQuestionProps {
  question: Question;
  index: number;
  onEdit: (question: Question) => void;
  onDelete: (id: string) => void;
  onSetDefault: (question: Question) => void;
  onAiSuggest: (question: Question) => void;
  questionTypes: { value: string; label: string }[];
}

const SortableQuestion: React.FC<SortableQuestionProps> = ({
  question,
  index,
  onEdit,
  onDelete,
  onSetDefault,
  onAiSuggest,
  questionTypes
}) => {
  const { t } = useLanguage();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card ref={setNodeRef} style={style} className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <TooltipWrapper content={t('tooltip.dragQuestion')}>
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab hover:cursor-grabbing p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <GripVertical className="h-5 w-5" />
              </div>
            </TooltipWrapper>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {index + 1}.
                </span>
                <CardTitle className="text-lg">{question.text}</CardTitle>
                {question.required && (
                  <Badge variant="destructive" className="text-xs">
                    {t('questionnaires.required')}
                  </Badge>
                )}
              </div>
              <CardDescription className="capitalize">
                {questionTypes.find(type => type.value === question.type)?.label}
              </CardDescription>
              {question.helpText && (
                <p className="text-sm text-muted-foreground mt-1">{question.helpText}</p>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <TooltipWrapper content={t('tooltip.aiSuggest')}>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onAiSuggest(question)}
                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </TooltipWrapper>
            
            <TooltipWrapper content={t('tooltip.editQuestion')}>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onEdit(question)}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            </TooltipWrapper>
            
            <TooltipWrapper content={t('tooltip.setDefault')}>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onSetDefault(question)}
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </TooltipWrapper>
            
            <TooltipWrapper content={t('tooltip.deleteQuestion')}>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onDelete(question.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipWrapper>
          </div>
        </div>
      </CardHeader>
      {question.defaultAnswer && (
        <CardContent>
          <div className="bg-muted p-3 rounded-lg">
            <Label className="text-sm font-medium">{t('questionnaires.defaultAnswer')}:</Label>
            <p className="text-sm text-muted-foreground mt-1">{question.defaultAnswer}</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export const QuestionnaireBuilder: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { isDemoMode } = useDemo();
  const { toast } = useToast();
  
  const demoData = getDemoData(language);
  const [questions, setQuestions] = useState<Question[]>(
    isDemoMode ? demoData.questions : []
  );
  
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDefaultDialog, setShowDefaultDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showQuickAddDialog, setShowQuickAddDialog] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [questionnaireTitle, setQuestionnaireTitle] = useState(
    language === 'he' ? 'שאלון חדש' : 'New Questionnaire'
  );
  const [selectedCategory, setSelectedCategory] = useState('');
  const [questionnaireLanguage, setQuestionnaireLanguage] = useState<'en' | 'he'>(language);
  const [isAutosaveEnabled, setIsAutosaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);

  // פרופיל ובדיקת תקפות
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const p = await fetchProfile();
        setProfile(p);
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, []);

  function hasValidCategory(p?: Profile | null) {
    if (!p) return false;
    if (!p.occupation) return false;

    // תיעדוף שדות "אחר" שיש בטבלה שלך:
    const otherText =
      (p as any).business_other   // אם בשימוש
      || (p as any).domain_text   // או השדה הזה אם קיים אצלך
      || p.other_text             // אם כבר הטמענו
      || (p as any).suboccupationFree
      || "";

    if (p.occupation === "other" || p.suboccupation === "other") {
      return otherText.trim().length > 1;
    }
    // כשלא "אחר" – נדרוש תת־תחום
    return Boolean(p.suboccupation || p.business_subcategory || p.sub_category);
  }

  const canSuggestAI = useMemo(() => hasValidCategory(profile) && !loadingProfile, [profile, loadingProfile]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const questionTypes = [
    { value: 'text', label: t('questionTypes.text') },
    { value: 'textarea', label: t('questionTypes.textarea') },
    { value: 'select', label: t('questionTypes.select') },
    { value: 'checkbox', label: t('questionTypes.checkbox') },
    { value: 'radio', label: t('questionTypes.radio') },
    { value: 'email', label: t('questionTypes.email') },
    { value: 'phone', label: t('questionTypes.phone') },
    { value: 'number', label: t('questionTypes.number') },
    { value: 'date', label: t('questionTypes.date') },
  ];

  const businessCategories = [
    { value: 'lawyer', label: t('category.lawyer') },
    { value: 'coach', label: t('category.coach') },
    { value: 'insurance', label: t('category.insurance') },
    { value: 'consultant', label: t('category.consultant') },
    { value: 'therapist', label: t('category.therapist') },
    { value: 'accountant', label: t('category.accountant') },
    { value: 'other', label: t('category.other') },
  ];

  // Auto-save functionality
  useEffect(() => {
    if (isAutosaveEnabled && questions.length > 0) {
      const timer = setTimeout(() => {
        setLastSaved(new Date());
        toast({
          title: t('toast.autosaved'),
          description: t('toast.autosavedDesc'),
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [questions, questionnaireTitle, isAutosaveEnabled, t, toast]);

  // Suggested questions by category
  const getSuggestedQuestions = (category: string): Question[] => {
    const suggestions = {
      lawyer: [
        { text: language === 'he' ? 'מה הנושא המשפטי שבו אתה זקוק לעזרה?' : 'What legal matter do you need help with?', type: 'textarea' },
        { text: language === 'he' ? 'מה הלוח הזמנים הרצוי שלך לפתרון?' : 'What is your desired timeline for resolution?', type: 'select' },
        { text: language === 'he' ? 'האם יש לך ניסיון קודם עם עורכי דין?' : 'Do you have previous experience with lawyers?', type: 'radio' },
        { text: language === 'he' ? 'מה התקציב שלך למשפט?' : 'What is your budget for legal services?', type: 'select' },
        { text: language === 'he' ? 'איך נוכל ליצור איתך קשר?' : 'How can we best contact you?', type: 'select' }
      ],
      coach: [
        { text: language === 'he' ? 'מה התחום שבו תרצה לקבל ליווי?' : 'What area would you like coaching in?', type: 'select' },
        { text: language === 'he' ? 'מה המטרה הראשית שלך?' : 'What is your main goal?', type: 'textarea' },
        { text: language === 'he' ? 'מה מדרגת המחויבות שלך?' : 'What is your level of commitment?', type: 'radio' },
        { text: language === 'he' ? 'איך תעדיף לקבל ליווי?' : 'How would you prefer to receive coaching?', type: 'select' },
        { text: language === 'he' ? 'מה התקציב החודשי שלך?' : 'What is your monthly budget?', type: 'select' }
      ],
      insurance: [
        { text: language === 'he' ? 'איזה סוג ביטוח מעניין אותך?' : 'What type of insurance interests you?', type: 'select' },
        { text: language === 'he' ? 'מה הכיסוי הנוכחי שלך?' : 'What is your current coverage?', type: 'textarea' },
        { text: language === 'he' ? 'מה גיל המבוטח?' : 'What is the age of the insured?', type: 'number' },
        { text: language === 'he' ? 'מה התקציב החודשי שלך?' : 'What is your monthly budget?', type: 'select' },
        { text: language === 'he' ? 'מתי תרצה להתחיל?' : 'When would you like to start?', type: 'date' }
      ],
      consultant: [
        { text: language === 'he' ? 'מה האתגר העסקי שלך?' : 'What is your business challenge?', type: 'textarea' },
        { text: language === 'he' ? 'מה גודל החברה שלך?' : 'What is your company size?', type: 'select' },
        { text: language === 'he' ? 'מה התחום שלך?' : 'What is your industry?', type: 'select' },
        { text: language === 'he' ? 'מה התקציב לפרויקט?' : 'What is the project budget?', type: 'select' },
        { text: language === 'he' ? 'מה לוח הזמנים?' : 'What is the timeline?', type: 'select' }
      ],
      therapist: [
        { text: language === 'he' ? 'מה הנושא שבו תרצה טיפול?' : 'What issue would you like to address?', type: 'textarea' },
        { text: language === 'he' ? 'האם יש לך ניסיון קודם בטיפול?' : 'Do you have previous therapy experience?', type: 'radio' },
        { text: language === 'he' ? 'איך תעדיף לקבל טיפול?' : 'How would you prefer to receive therapy?', type: 'select' },
        { text: language === 'he' ? 'מה הזמינות שלך?' : 'What is your availability?', type: 'select' },
        { text: language === 'he' ? 'מה דחיפות הנושא?' : 'How urgent is the matter?', type: 'radio' }
      ],
      accountant: [
        { text: language === 'he' ? 'איזה שירות חשבונאי אתה צריך?' : 'What accounting service do you need?', type: 'select' },
        { text: language === 'he' ? 'מה סוג העסק שלך?' : 'What type of business do you have?', type: 'select' },
        { text: language === 'he' ? 'מה המחזור השנתי?' : 'What is your annual turnover?', type: 'select' },
        { text: language === 'he' ? 'איזה תוכנה אתה משתמש?' : 'What software do you use?', type: 'select' },
        { text: language === 'he' ? 'מתי אתה צריך את השירות?' : 'When do you need the service?', type: 'date' }
      ]
    };

    return (suggestions[category as keyof typeof suggestions] || []).map((q, index) => ({
      id: `suggested_${Date.now()}_${index}`,
      text: q.text,
      type: q.type,
      required: true,
      defaultAnswer: ''
    }));
  };

  // Quick questions library
  const getQuickQuestions = (): Question[] => [
    {
      id: `quick_${Date.now()}_1`,
      text: language === 'he' ? 'מה השם המלא שלך?' : 'What is your full name?',
      type: 'text',
      required: true,
      defaultAnswer: ''
    },
    {
      id: `quick_${Date.now()}_2`, 
      text: language === 'he' ? 'מה כתובת האימייל שלך?' : 'What is your email address?',
      type: 'email',
      required: true,
      defaultAnswer: ''
    },
    {
      id: `quick_${Date.now()}_3`,
      text: language === 'he' ? 'מה מספר הטלפון שלך?' : 'What is your phone number?',
      type: 'phone',
      required: true,
      defaultAnswer: ''
    },
    {
      id: `quick_${Date.now()}_4`,
      text: language === 'he' ? 'איך שמעת עלינו?' : 'How did you hear about us?',
      type: 'select',
      required: false,
      defaultAnswer: ''
    },
    {
      id: `quick_${Date.now()}_5`,
      text: language === 'he' ? 'מה התקציב שלך?' : 'What is your budget?',
      type: 'select',
      required: false,
      defaultAnswer: ''
    }
  ];

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);

        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        toast({
          title: t('toast.questionReordered'),
          description: t('toast.questionReorderedDesc'),
        });

        return newOrder;
      });
    }
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      text: language === 'he' ? 'שאלה חדשה' : 'New Question',
      type: 'text',
      required: true,
      defaultAnswer: ''
    };
    setQuestions([...questions, newQuestion]);
    setEditingQuestion(newQuestion);
    setShowAddDialog(true);
    
    toast({
      title: t('toast.questionAdded'),
      description: t('toast.questionAddedDesc'),
    });
  };

  const addSuggestedQuestions = (category: string) => {
    const suggested = getSuggestedQuestions(category);
    setQuestions([...questions, ...suggested]);
    setShowCategoryDialog(false);
    
    toast({
      title: t('toast.questionAdded'),
      description: `${suggested.length} ${t('toast.questionAddedDesc')}`,
    });
  };

  const addQuickQuestion = (quickQuestion: Question) => {
    setQuestions([...questions, quickQuestion]);
    setShowQuickAddDialog(false);
    
    toast({
      title: t('toast.questionAdded'),
      description: t('toast.questionAddedDesc'),
    });
  };

  const updateQuestion = (updatedQuestion: Question) => {
    setQuestions(questions.map(q => 
      q.id === updatedQuestion.id ? updatedQuestion : q
    ));
    setEditingQuestion(null);
    setShowAddDialog(false);
    
    toast({
      title: t('toast.questionUpdated'),
      description: t('toast.questionUpdatedDesc'),
    });
  };

  const deleteQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId));
    
    toast({
      title: t('toast.questionDeleted'),
      description: t('toast.questionDeletedDesc'),
    });
  };

  const setDefaultAnswer = (questionId: string, defaultAnswer: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, defaultAnswer } : q
    ));
    setShowDefaultDialog(false);
    
    toast({
      title: t('toast.defaultAnswerSet'),
      description: t('toast.defaultAnswerSetDesc'),
    });
  };

  const generateAiSuggestion = (question: Question) => {
    // Simulate AI suggestion
    const suggestions = {
      [language === 'he' ? 'מה השם המלא שלך?' : 'What is your full name?']: 
        language === 'he' ? 'יחזיק את הפרטים לצורך יצירת קשר מותאם אישית' : 'Keep details for personalized contact',
      [language === 'he' ? 'מה כתובת האימייל שלך?' : 'What is your email address?']: 
        language === 'he' ? 'נשתמש באימייל לשליחת מידע נוסף והצעות מותאמות' : 'We\'ll use email for additional info and tailored offers',
      [language === 'he' ? 'מה מספר הטלפון שלך?' : 'What is your phone number?']: 
        language === 'he' ? 'לקביעת פגישת ייעוץ טלפונית מהירה' : 'For scheduling a quick phone consultation'
    };

    const suggestion = suggestions[question.text as keyof typeof suggestions] || 
      (language === 'he' ? 'תשובה חכמה שנוצרה על ידי AI' : 'Smart AI-generated response');

    setQuestions(questions.map(q => 
      q.id === question.id ? { ...q, defaultAnswer: suggestion } : q
    ));
    
    toast({
      title: t('toast.aiSuggestionGenerated'),
      description: t('toast.aiSuggestionGeneratedDesc'),
    });
  };

  const duplicateQuestionnaire = () => {
    toast({
      title: t('toast.questionnaireDuplicated'),
      description: t('toast.questionnaireDuplicatedDesc'),
    });
  };

  const shareQuestionnaire = async () => {
    const shareUrl = `https://ihoogi.com/q/${Date.now()}`;
    announce('הקישור עודכן');
    try { await navigator.clipboard.writeText(shareUrl); globalToast.success('קישור הועתק'); }
    catch { globalToast.error('לא ניתן להעתיק', { description: 'נסי ידנית' }); }
  };

  const isReadyToSend = questions.length >= 3 && questionnaireTitle.trim() !== '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <TooltipWrapper content={t('common.back')}>
            <Button variant="ghost" size="icon" onClick={() => navigate('/questionnaires')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </TooltipWrapper>
          <div className="flex-1">
            <Input 
              value={questionnaireTitle}
              onChange={(e) => setQuestionnaireTitle(e.target.value)}
              className="text-2xl font-bold border-none bg-transparent p-0 h-auto text-primary"
              placeholder={language === 'he' ? 'שם השאלון...' : 'Questionnaire name...'}
            />
            <p className="text-muted-foreground">
              {t('builder.subtitle')}
            </p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <TooltipWrapper content={t('tooltip.duplicate')}>
            <Button variant="outline" size="sm" onClick={duplicateQuestionnaire}>
              <Copy className="h-4 w-4 mr-2" />
              {t('builder.duplicateQuestionnaire')}
            </Button>
          </TooltipWrapper>
          
          <TooltipWrapper content={t('tooltip.preview')}>
            <Button variant="outline" className="hidden lg:flex">
              <Eye className="h-4 w-4 mr-2" />
              {t('builder.preview')}
            </Button>
          </TooltipWrapper>

          <TooltipWrapper content={isReadyToSend ? t('tooltip.readyToSend') : t('builder.unsavedChanges')}>
            <Button 
              variant={isReadyToSend ? "hoogi" : "outline"}
              onClick={() => setShowShareDialog(true)}
              disabled={!isReadyToSend}
            >
              {isReadyToSend ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {t('builder.readyToSend')}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {t('common.save')}
                </>
              )}
            </Button>
          </TooltipWrapper>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isAutosaveEnabled ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span>{isAutosaveEnabled ? t('builder.autosaveEnabled') : t('builder.autosave')}</span>
          </div>
          {lastSaved && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{t('builder.lastSaved')}: {lastSaved.toLocaleTimeString()}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={questionnaireLanguage} onValueChange={(value) => setQuestionnaireLanguage(value as 'en' | 'he')}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="he">עברית</SelectItem>
            </SelectContent>
          </Select>
          <TooltipWrapper content={t('tooltip.setQuestionnaireLanguage')}>
            <Label className="text-sm text-muted-foreground">
              {t('builder.questionnaireLanguage')}
            </Label>
          </TooltipWrapper>
        </div>
      </div>

      {/* Hoogi Message */}
      <HoogiMessage message={t('hoogi.builderHelp')} />

      {/* Main Content Tabs */}
      <Tabs defaultValue="builder" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="builder">{t('builder.customQuestions')}</TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            {t('builder.preview')}
          </TabsTrigger>
          <TabsTrigger value="share" className="flex items-center gap-2">
            <Share className="h-4 w-4" />
            {t('builder.share')}
          </TabsTrigger>
        </TabsList>

        {/* Builder Tab */}
        <TabsContent value="builder" className="space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card 
              className={`cursor-pointer transition-shadow ${
                canSuggestAI 
                  ? 'hover:shadow-md' 
                  : 'opacity-50 cursor-not-allowed'
              }`} 
              onClick={() => {
                if (canSuggestAI) {
                  setShowCategoryDialog(true);
                } else {
                  toast({
                    title: "שגיאה",
                    description: "יש לבחור קטגוריה עסקית תחילה",
                    variant: "destructive"
                  });
                }
              }}
            >
              <CardContent className="flex items-center justify-center p-6">
                <div className="text-center">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <h3 className="font-medium">{t('builder.suggestedQuestions')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {canSuggestAI 
                      ? t('builder.selectCategoryDesc')
                      : "יש לבחור קטגוריה עסקית תחילה"
                    }
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowQuickAddDialog(true)}>
              <CardContent className="flex items-center justify-center p-6">
                <div className="text-center">
                  <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                  <h3 className="font-medium">{t('builder.quickQuestions')}</h3>
                  <p className="text-sm text-muted-foreground">{t('tooltip.quickAdd')}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={addQuestion}>
              <CardContent className="flex items-center justify-center p-6">
                <div className="text-center">
                  <Plus className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <h3 className="font-medium">{t('questionnaires.addQuestion')}</h3>
                  <p className="text-sm text-muted-foreground">{t('tooltip.addQuestion')}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-center p-6">
                <div className="text-center">
                  <Heart className="h-8 w-8 mx-auto mb-2 text-red-600" />
                  <h3 className="font-medium">{t('builder.branding')}</h3>
                  <p className="text-sm text-muted-foreground">{t('tooltip.brandingDefaults')}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {questions.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                  {questions.map((question, index) => (
                    <SortableQuestion
                      key={question.id}
                      question={question}
                      index={index}
                      onEdit={(q) => {
                        setEditingQuestion(q);
                        setShowAddDialog(true);
                      }}
                      onDelete={deleteQuestion}
                      onSetDefault={(q) => {
                        setEditingQuestion(q);
                        setShowDefaultDialog(true);
                      }}
                      onAiSuggest={generateAiSuggestion}
                      questionTypes={questionTypes}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            ) : (
              <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Plus className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t('questionnaires.addQuestion')}</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {language === 'he' ? 'התחל בהוספת השאלה הראשונה שלך' : 'Start by adding your first question'}
                  </p>
                  <Button onClick={addQuestion}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('questionnaires.addQuestion')}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">{t('builder.preview')}</h3>
            <div className="flex items-center gap-2">
              <TooltipWrapper content={t('tooltip.desktopPreview')}>
                <Button
                  variant={previewMode === 'desktop' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('desktop')}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
              </TooltipWrapper>
              <TooltipWrapper content={t('tooltip.mobilePreview')}>
                <Button
                  variant={previewMode === 'mobile' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('mobile')}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </TooltipWrapper>
            </div>
          </div>

          <div className={`mx-auto border rounded-lg overflow-hidden ${
            previewMode === 'mobile' ? 'max-w-md' : 'max-w-2xl'
          }`}>
            <div className="bg-white p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-primary mb-2">{questionnaireTitle}</h2>
                <p className="text-muted-foreground">
                  {language === 'he' ? 'תודה על העניין! אנא מלא את הפרטים הבאים.' : 'Thank you for your interest! Please fill out the following details.'}
                </p>
              </div>

              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div key={question.id} className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <span>{index + 1}. {question.text}</span>
                      {question.required && <span className="text-red-500">*</span>}
                    </Label>
                    {question.type === 'textarea' ? (
                      <Textarea 
                        placeholder={question.placeholder || (language === 'he' ? 'הזן תשובה...' : 'Enter your answer...')}
                        disabled
                      />
                    ) : question.type === 'select' ? (
                      <Select disabled>
                        <SelectTrigger>
                          <SelectValue placeholder={language === 'he' ? 'בחר אפשרות...' : 'Select option...'} />
                        </SelectTrigger>
                      </Select>
                    ) : (
                      <Input 
                        type={question.type === 'email' ? 'email' : question.type === 'phone' ? 'tel' : 'text'}
                        placeholder={question.placeholder || (language === 'he' ? 'הזן תשובה...' : 'Enter your answer...')}
                        disabled
                      />
                    )}
                    {question.helpText && (
                      <p className="text-sm text-muted-foreground">{question.helpText}</p>
                    )}
                  </div>
                ))}
              </div>

              {questions.length > 0 && (
                <div className="mt-6 text-center">
                  <Button className="w-full" disabled>
                    {language === 'he' ? 'שלח' : 'Submit'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Share Tab */}
        <TabsContent value="share" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="h-5 w-5" />
                  {t('builder.getLink')}
                </CardTitle>
                <CardDescription>{t('builder.recipientView')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input 
                    value={`https://ihoogi.com/q/${Date.now()}`}
                    readOnly
                    className="bg-muted"
                  />
                  <Button onClick={shareQuestionnaire}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share className="h-5 w-5" />
                  {t('builder.shareOptions')}
                </CardTitle>
                <CardDescription>{t('builder.previewMessage')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {t('builder.shareWhatsApp')}
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  {t('builder.shareEmail')}
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Phone className="h-4 w-4 mr-2" />
                  {t('builder.shareSMS')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      
      {/* Category Selection Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('builder.selectCategory')}</DialogTitle>
            <DialogDescription>
              {t('builder.selectCategoryDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {businessCategories.map((category) => (
              <Button
                key={category.value}
                variant="outline"
                className="justify-start h-auto p-4"
                onClick={() => addSuggestedQuestions(category.value)}
              >
                <div className="text-left">
                  <div className="font-medium">{category.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {language === 'he' ? '5 שאלות מומלצות' : '5 recommended questions'}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Add Dialog */}
      <Dialog open={showQuickAddDialog} onOpenChange={setShowQuickAddDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('builder.addQuickQuestion')}</DialogTitle>
            <DialogDescription>
              {language === 'he' ? 'בחר שאלה מהרשימה המוכנה' : 'Choose from ready-made questions'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {getQuickQuestions().map((question) => (
              <Button
                key={question.id}
                variant="outline"
                className="justify-start h-auto p-4"
                onClick={() => addQuickQuestion(question)}
              >
                <div className="text-left">
                  <div className="font-medium">{question.text}</div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {questionTypes.find(type => type.value === question.type)?.label}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Question Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion?.id?.startsWith('q_') ? t('questionnaires.addQuestion') : t('common.edit')}
            </DialogTitle>
            <DialogDescription>
              {t('builder.questionSettings')}
            </DialogDescription>
          </DialogHeader>
          {editingQuestion && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="question-text">{t('questionnaires.questionText')}</Label>
                <Textarea
                  id="question-text"
                  value={editingQuestion.text}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    text: e.target.value
                  })}
                  placeholder={language === 'he' ? 'הזן את טקסט השאלה...' : 'Enter question text...'}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="question-type">{t('questionnaires.questionType')}</Label>
                <Select
                  value={editingQuestion.type}
                  onValueChange={(value) => setEditingQuestion({
                    ...editingQuestion,
                    type: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {questionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="help-text">{t('builder.helpText')}</Label>
                <Input
                  id="help-text"
                  value={editingQuestion.helpText || ''}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    helpText: e.target.value
                  })}
                  placeholder={language === 'he' ? 'טקסט עזרה אופציונלי...' : 'Optional help text...'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="placeholder">{t('builder.placeholder')}</Label>
                <Input
                  id="placeholder"
                  value={editingQuestion.placeholder || ''}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    placeholder: e.target.value
                  })}
                  placeholder={language === 'he' ? 'טקסט ממלא מקום...' : 'Placeholder text...'}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="required"
                  checked={editingQuestion.required}
                  onCheckedChange={(checked) => setEditingQuestion({
                    ...editingQuestion,
                    required: checked
                  })}
                />
                <Label htmlFor="required">{t('questionnaires.required')}</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => editingQuestion && updateQuestion(editingQuestion)}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Default Answer Dialog */}
      <Dialog open={showDefaultDialog} onOpenChange={setShowDefaultDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('questionnaires.setDefaultAnswer')}</DialogTitle>
            <DialogDescription>
              {editingQuestion?.text}
            </DialogDescription>
          </DialogHeader>
          {editingQuestion && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="default-answer">{t('questionnaires.defaultAnswer')}</Label>
                <Textarea
                  id="default-answer"
                  value={editingQuestion.defaultAnswer}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    defaultAnswer: e.target.value
                  })}
                  placeholder={language === 'he' ? 'הזן תשובת ברירת מחדל...' : 'Enter default answer...'}
                />
              </div>
              <div className="flex items-center gap-2">
                <TooltipWrapper content={t('tooltip.aiSuggest')}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateAiSuggestion(editingQuestion)}
                    className="flex items-center gap-2"
                  >
                    <Wand2 className="h-4 w-4" />
                    {t('builder.aiSuggestAnswer')}
                  </Button>
                </TooltipWrapper>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDefaultDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => editingQuestion && setDefaultAnswer(editingQuestion.id, editingQuestion.defaultAnswer)}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};