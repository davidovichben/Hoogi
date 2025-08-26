import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Skeleton } from "../../../components/ui/skeleton";
import { ArrowLeft, FileText, Settings, Zap, Users, Globe, Share2, QrCode, BarChart3, Eye } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useToast } from "../../../hooks/use-toast";
import { useLanguage } from "../../../contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  publishQuestionnaire, 
  ensurePublicToken, 
  buildPublicUrl,
  generateQRCode,
  getQuestionnaireStats,
  getEmbedCode
} from "../../../services/questionnaires";
import { DEFAULT_META } from "../../../models/questionnaire";
import PublicPreviewModal from '../preview/PublicPreviewModal';

// Import all the new components
import { MetaPanel } from "./MetaPanel";
import { QuestionsPreview } from "./QuestionsPreview";
import { LanguageTools } from "./LanguageTools";
import { ChannelsPanel } from "./ChannelsPanel";
import { AutomationPanel } from "./AutomationPanel";
import { ValidationPanel } from "./ValidationPanel";
import { PublishBar } from "./PublishBar";

export default function ReviewAndPublishPage() {
  const params = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useLanguage();
  const id = params?.id as string;
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedChannel, setSelectedChannel] = useState('landing');
  const [automationSettings, setAutomationSettings] = useState<any>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const finishRef = useRef(false);

  // חדש: שיתוף ציבורי מתקדם
  const [showPreview, setShowPreview] = useState(false);
  const [token, setToken] = useState<string|null>(null);
  const [publicUrl, setPublicUrl] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [embedCode, setEmbedCode] = useState<string>('');
  const [stats, setStats] = useState<any>(null);
  const [isPublished, setIsPublished] = useState(false);

  // Load real questionnaire data
  useEffect(() => {
    console.log('ReviewAndPublishPage useEffect - ID:', id, 'Language:', language);
    
    if (!id || id === '[ID]' || id === '%5BID%5D') {
      console.warn('Invalid ID provided, redirecting to questionnaires');
      navigate('/');
      return;
    }

    // בדוקID הוא UUID תקין
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.warn('Invalid UUID format, redirecting to questionnaires');
      navigate('/');
      return;
    }

    loadQuestionnaireData();
  }, [id, navigate, language]);

  const loadQuestionnaireData = async () => {
    try {
      setLoading(true);
      console.log('Loading questionnaire data for ID:', id);

      // Load questionnaire data
      const { data: questionnaire, error: qError } = await supabase
        .from('questionnaires')
        .select('*')
        .eq('id', id)
        .single();

      if (qError) {
        console.error('Error loading questionnaire:', qError);
        throw qError;
      }

      if (!questionnaire) {
        throw new Error('Questionnaire not found');
      }

      // Load questions
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('questionnaire_id', id)
        .order('created_at', { ascending: true });

      if (questionsError) {
        console.error('Error loading questions:', questionsError);
        throw questionsError;
      }

      // Extract design colors and other metadata
      const designColors = questionnaire.design_colors || {};
      const normalizedMeta = questionnaire.meta || DEFAULT_META;

      const questionnaireData = {
        questionnaire: {
          id: questionnaire.id,
          title: questionnaire.title || '',
          category: questionnaire.category || '',
          companyName: designColors.company_name || '',
          logoUrl: questionnaire.logo_url || '',
          primaryColor: designColors.primary_color || '#16939B',
          secondaryColor: designColors.secondary_color || '#FFD500',
          language: designColors.language || 'he',
          status: designColors.status || 'draft',
          meta: {
            ...normalizedMeta,
            primaryLanguage: designColors.language || 'he'
          },
          // חדש: שדות לשיתוף ציבורי
          public_token: questionnaire.public_token,
          is_published: questionnaire.is_published || false
        },
        questions: questions || [],
        options: []
      };

      console.log('Loaded questionnaire data:', questionnaireData);
      setData(questionnaireData);
      
      // Load existing automation settings if any
      if (normalizedMeta.automationSettings) {
        setAutomationSettings(normalizedMeta.automationSettings);
      }
      
      if (normalizedMeta.selectedChannel) {
        setSelectedChannel(normalizedMeta.selectedChannel);
      }

      // חדש: בדוק אם השאלון פורסם ויצור קישור ציבורי
      if (questionnaire.public_token && questionnaire.is_published) {
        setIsPublished(true);
        const url = buildPublicUrl(questionnaire.public_token);
        setPublicUrl(url);
        setToken(questionnaire.public_token);
      }

    } catch (err: any) {
      console.error('Error loading questionnaire data:', err);
      setError(err.message || 'Failed to load questionnaire data');
      
      // Show toast with error
      toast({
        title: language === 'he' ? 'שגיאה בטעינה' : 'Loading Error',
        description: language === 'he' 
          ? 'לא ניתן היה לטעון את השאלון' 
          : 'Could not load questionnaire',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // חדש: פונקציות לשיתוף ציבורי
  const handlePublish = async () => {
    try {
      setIsSubmitting(true);
      
      // צור טוקן ציבורי אם לא קיים
      if (!token) {
        const newToken = await ensurePublicToken(id);
        setToken(newToken);
        const url = buildPublicUrl(newToken);
        setPublicUrl(url);
      }
      
      // פרסם את השאלון
      const success = await publishQuestionnaire(id);
      if (success) {
        setIsPublished(true);
        toast({
          title: language === 'he' ? 'השאלון פורסם!' : 'Questionnaire published!',
          description: language === 'he' 
            ? 'השאלון זמין כעת לציבור' 
            : 'Questionnaire is now available to the public'
        });
      }
    } catch (error: any) {
      console.error('Error publishing questionnaire:', error);
      toast({
        title: language === 'he' ? 'שגיאה בפרסום' : 'Publishing Error',
        description: language === 'he' 
          ? 'לא ניתן היה לפרסם את השאלון' 
          : 'Could not publish questionnaire',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // חדש: פונקציה לתצוגה מקדימה פרטית (לא ציבורית)
  const handlePreview = () => {
    // Redirect to new distribute route instead of old preview route
    navigate(`/distribute?qid=${id}`);
  };

  // חדש: פונקציה לתצוגה מקדימה ציבורית
  const handlePublicPreview = () => {
    if (token) {
      setShowPreview(true);
    } else {
      toast({
        title: language === 'he' ? 'שגיאה' : 'Error',
        description: language === 'he' 
          ? 'יש ליצור קישור ציבורי קודם' 
          : 'Please create a public link first',
        variant: 'destructive'
      });
    }
  };

  const handleGenerateQR = async () => {
    if (!publicUrl) return;
    
    try {
      const qrUrl = await generateQRCode(publicUrl);
      setQrCodeUrl(qrUrl);
      toast({
        title: language === 'he' ? 'QR Code נוצר!' : 'QR Code generated!',
        description: language === 'he' 
          ? 'QR Code זמין להעתקה' 
          : 'QR Code is ready for copying'
      });
    } catch (error) {
      toast({
        title: language === 'he' ? 'שגיאה' : 'Error',
        description: language === 'he' 
          ? 'לא ניתן היה ליצור QR Code' 
          : 'Could not generate QR Code',
        variant: 'destructive'
      });
    }
  };

  const handleGenerateEmbed = async () => {
    if (!publicUrl) return;
    
    try {
      const embed = await getEmbedCode(publicUrl);
      setEmbedCode(embed);
      toast({
        title: language === 'he' ? 'קוד הטמעה נוצר!' : 'Embed code generated!',
        description: language === 'he' 
          ? 'קוד ההטמעה זמין להעתקה' 
          : 'Embed code is ready for copying'
      });
    } catch (error) {
      toast({
        title: language === 'he' ? 'שגיאה' : 'Error',
        description: language === 'he' 
          ? 'לא ניתן היה ליצור קוד הטמעה' 
          : 'Could not generate embed code',
        variant: 'destructive'
      });
    }
  };

  const handleLoadStats = async () => {
    if (!id) return;
    
    try {
      const statsData = await getQuestionnaireStats(id);
      setStats(statsData);
      toast({
        title: language === 'he' ? 'סטטיסטיקות נטענו!' : 'Stats loaded!',
        description: language === 'he' 
          ? `${statsData.total_responses} תשובות סה"כ` 
          : `${statsData.total_responses} total responses`
      });
    } catch (error) {
      toast({
        title: language === 'he' ? 'שגיאה' : 'Error',
        description: language === 'he' 
          ? 'לא ניתן היה לטעון סטטיסטיקות' 
          : 'Could not load statistics',
        variant: 'destructive'
      });
    }
  };

  const copyToClipboard = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: language === 'he' ? 'הועתק' : 'Copied',
        description: successMessage
      });
    } catch (error) {
      toast({
        title: language === 'he' ? 'שגיאה' : 'Error',
        description: language === 'he' 
          ? 'לא ניתן היה להעתיק' 
          : 'Could not copy',
        variant: 'destructive'
      });
    }
  };

  const handleQuestionnaireUpdate = (updates: any) => {
    setData((prev: any) => ({
      ...prev,
      questionnaire: { ...prev.questionnaire, ...updates }
    }));
  };

  const handleQuestionsUpdate = (questions: any[]) => {
    setData((prev: any) => ({
      ...prev,
      questions
    }));
  };

  const handleDuplicateToChannel = async (targetChannel: string) => {
    toast({
      title: language === 'he' ? 'השאלון הועתק בהצלחה' : 'Questionnaire duplicated successfully',
      description: language === 'he' 
        ? `השאלון הועתק לערוץ ${targetChannel}` 
        : `Questionnaire duplicated to ${targetChannel} channel`
    });
    return Promise.resolve();
  };

  const handleBackToEdit = () => {
    console.log('🔍 handleBackToEdit called');
    console.log('📋 Current ID from params:', id);
    console.log('📋 Current data.questionnaire.id:', data?.questionnaire?.id);
    
    // Go back to onboarding step 2 (question builder)
    const targetId = data?.questionnaire?.id || id;
    const targetUrl = `/onboarding?step=2&id=${targetId}`;
    
    console.log('🚀 Navigating to:', targetUrl);
    navigate(targetUrl);
  };

  const handleContinue = () => {
    // Priority 1: Navigate to new distribute route if questionnaire has public_token
    if (id && data?.questionnaire?.public_token) {
      console.log('Navigating to new distribute route with public_token:', data.questionnaire.public_token);
      navigate(`/distribute?qid=${id}`);
      return;
    }
    
    // Fallback: Navigate to distribute route without public_token (will handle creation)
    if (id) {
      console.log('Navigating to distribute route for questionnaire setup:', id);
      navigate(`/distribute?qid=${id}`);
      return;
    } else {
      // Final fallback to home if no ID
      console.warn('No questionnaire ID, navigating to home');
      navigate('/');
    }
  };

  const handleSaveDraft = async () => {
    try {
      // Save current state to database
      const { error } = await supabase
        .from('questionnaires')
        .update({
          design_colors: {
            ...data.questionnaire,
            status: 'draft'
          },
          meta: {
            automationSettings,
            selectedChannel: selectedChannel
          }
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: language === 'he' ? 'הטיוטה נשמרה' : 'Draft saved',
        description: language === 'he' ? 'השאלון נשמר כטיוטה' : 'Your questionnaire has been saved as a draft'
      });
    } catch (err: any) {
      toast({
        title: language === 'he' ? 'שגיאה בשמירה' : 'Save error',
        description: language === 'he' 
          ? 'לא ניתן היה לשמור את הטיוטה' 
          : 'Could not save draft',
        variant: 'destructive'
      });
    }
  };

  const handleFinish = async (e?: React.MouseEvent | React.FormEvent) => {
    e?.preventDefault?.();
    if (finishRef.current || isSubmitting || !data?.questionnaire?.id) return;
    
    finishRef.current = true;
    setIsSubmitting(true);
    
    try {
      const ok = await publishQuestionnaire(data.questionnaire.id);
      if (!ok) throw new Error("publish failed");
      
      // Navigate to questionnaires list
      navigate("/questionnaires", { replace: true });
    } catch (err) {
      console.error("finish error", err);
      // Keep existing error handling
    } finally {
      setIsSubmitting(false);
      finishRef.current = false;
    }
  };

  // חדש: פונקציות שיתוף ציבורי
  async function onCreatePublicLink(qid: string) {
    try {
      const t = await ensurePublicToken(qid);
      const url = buildPublicUrl(t);
      await navigator.clipboard.writeText(url);
      toast({
        title: language === 'he' ? 'הקישור הועתק' : 'Link copied',
        description: language === 'he' 
          ? 'הקישור הציבורי הועתק ללוח' 
          : 'Public link copied to clipboard'
      });
    } catch (error) {
      toast({
        title: language === 'he' ? 'שגיאה ביצירת קישור' : 'Link creation error',
        description: language === 'he' 
          ? 'לא ניתן היה ליצור קישור ציבורי' 
          : 'Could not create public link',
        variant: 'destructive'
      });
    }
  }



  if (loading) {
    return (
      <div className="min-h-screen bg-background" dir={language === 'he' ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir={language === 'he' ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {language === 'he' ? 'שגיאה בטעינה' : 'Loading Error'}
          </h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => window.location.reload()}>
              {language === 'he' ? 'נסה שוב' : 'Try Again'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/')}>
              {language === 'he' ? 'חזרה לדף הבית' : 'Back to Home'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir={language === 'he' ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {language === 'he' ? 'השאלון לא נמצא' : 'Questionnaire not found'}
          </h2>
          <p className="text-muted-foreground mb-4">
            {language === 'he' 
              ? 'לא ניתן היה לטעון את השאלון המבוקש' 
              : "The requested questionnaire could not be loaded."
            }
          </p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className={`h-4 w-4 ${language === 'he' ? 'ml-2' : 'mr-2'}`} />
            {language === 'he' ? 'חזרה לשאלונים' : 'Back to Questionnaires'}
          </Button>
        </div>
      </div>
    );
  }

  const { questionnaire, questions } = data;
  const safeMeta = questionnaire.meta ?? DEFAULT_META;
  const primaryLanguage = safeMeta.primaryLanguage || questionnaire.language || 'he';

  // Generate validation issues for PublishBar
  const criticalIssues = [];
  const warnings = [];

  if (!questionnaire.title?.trim()) {
    criticalIssues.push({ 
      message: language === 'he' ? 'כותרת השאלון נדרשת' : 'Questionnaire title is required' 
    });
  }

  if (questions.length === 0) {
    criticalIssues.push({ 
      message: language === 'he' ? 'נדרשת לפחות שאלה אחת' : 'At least one question is required' 
    });
  }

  if (!questionnaire.category) {
    warnings.push({ 
      message: language === 'he' ? 'לא נבחרה קטגוריה' : 'No category selected' 
    });
  }

  console.log('Rendering ReviewAndPublishPage with data:', { questionnaire, questions, criticalIssues, warnings });

  return (
    <div className="min-h-screen bg-background" dir={language === 'he' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto p-6 space-y-6 pb-24">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className={`h-4 w-4 ${language === 'he' ? 'rotate-180' : ''}`} />
              {language === 'he' ? 'חזרה לשאלונים' : 'Back to Questionnaires'}
            </Button>
          </div>

          <Card 
            className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5"
            style={{
              borderColor: `${questionnaire.primaryColor}40`,
              background: `linear-gradient(to right, ${questionnaire.primaryColor}10, ${questionnaire.secondaryColor}10)`
            }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Zap className="h-7 w-7" style={{ color: questionnaire.primaryColor }} />
                <span style={{ color: questionnaire.primaryColor }}>
                  {language === 'he' ? 'סקירה ופרסום' : 'Review & Publish'}
                </span>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {language === 'he' ? 'שלב 3' : 'Step 3'}
                </Badge>
              </CardTitle>
              <CardDescription className="text-lg">
                {language === 'he' 
                  ? 'סקור את הגדרות השאלון והכן לפרסום' 
                  : 'Review your questionnaire settings and prepare for publication'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div className="text-center p-4 bg-background rounded-lg border">
                  <span className="font-medium block mb-2">
                    {language === 'he' ? 'שאלון:' : 'Questionnaire:'}
                  </span>
                  <p className="text-muted-foreground font-semibold">
                    {questionnaire.title || (language === 'he' ? 'ללא כותרת' : 'Untitled')}
                  </p>
                </div>
                <div className="text-center p-4 bg-background rounded-lg border">
                  <span className="font-medium block mb-2">
                    {language === 'he' ? 'שאלות:' : 'Questions:'}
                  </span>
                  <p className="text-muted-foreground font-semibold">
                    {questions.length} {language === 'he' ? 'שאלות' : 'questions'}
                  </p>
                </div>
                <div className="text-center p-4 bg-background rounded-lg border">
                  <span className="font-medium block mb-2">
                    {language === 'he' ? 'שפה עיקרית:' : 'Primary Language:'}
                  </span>
                  <p className="text-muted-foreground font-semibold">
                    {primaryLanguage === 'he' ? 'עברית' : 'Hebrew'}
                  </p>
                </div>
              </div>
              
              {/* Company Info with Logo */}
              {questionnaire.companyName && (
                <div className="mt-6 p-4 bg-background rounded-lg border text-center">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    {questionnaire.logoUrl && (
                      <img 
                        src={questionnaire.logoUrl} 
                        alt="Company Logo" 
                        className="h-8 w-8 object-contain"
                      />
                    )}
                    <span className="font-medium text-lg" style={{ color: questionnaire.primaryColor }}>
                      {questionnaire.companyName}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full border-2 border-white shadow-sm" 
                        style={{ backgroundColor: questionnaire.primaryColor }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {language === 'he' ? 'צבע ראשי' : 'Primary Color'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full border-2 border-white shadow-sm" 
                        style={{ backgroundColor: questionnaire.secondaryColor }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {language === 'he' ? 'צבע משני' : 'Secondary Color'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <MetaPanel 
              questionnaire={questionnaire}
              onUpdate={handleQuestionnaireUpdate}
            />
            
            <QuestionsPreview
              questions={questions}
              onUpdate={handleQuestionsUpdate}
              onBackToEdit={handleBackToEdit}
            />
            
            <LanguageTools
              questionnaire={questionnaire}
              questions={questions}
              primaryLanguage={primaryLanguage}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <ChannelsPanel
              questionnaire={questionnaire}
              selectedChannel={selectedChannel}
              onChannelChange={setSelectedChannel}
              onDuplicateToChannel={handleDuplicateToChannel}
            />
            
            <AutomationPanel
              questionnaire={questionnaire}
              automationSettings={automationSettings}
              onUpdate={setAutomationSettings}
            />
            
            <ValidationPanel
              questionnaire={questionnaire}
              questions={questions}
              automationSettings={automationSettings}
              selectedChannel={selectedChannel}
              primaryLanguage={primaryLanguage}
            />
          </div>
        </div>

        {/* חדש: כפתורי שיתוף ציבורי */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {language === 'he' ? 'שיתוף ציבורי' : 'Public Sharing'}
              </CardTitle>
              <CardDescription>
                {language === 'he' 
                  ? 'צור קישור ציבורי לשאלון ותצוגה מקדימה' 
                  : 'Create public link and preview questionnaire'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Status Info */}
                {isPublished ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">
                        {language === 'he' ? 'השאלון פורסם וזמין לציבור' : 'Questionnaire is published and available to the public'}
                      </span>
                    </div>
                    {publicUrl && (
                      <div className="mt-2 text-sm text-green-700">
                        {language === 'he' ? 'קישור:' : 'Link:'} {publicUrl}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-medium">
                        {language === 'he' ? 'השאלון עדיין לא פורסם' : 'Questionnaire is not yet published'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  {/* Hidden: Old create public link button - replaced by /distribute route
                  <Button 
                    onClick={() => onCreatePublicLink(data.questionnaire.id)}
                    variant="outline"
                    className="flex-1"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    {language === 'he' ? 'צור קישור ציבורי' : 'Create Public Link'}
                  </Button>
                  */}
                  
                  {/* Hidden: Old preview button - replaced by /distribute route
                  <Button 
                    onClick={handlePreview}
                    variant="outline"
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {language === 'he' ? 'תצוגה מקדימה' : 'Preview'}
                  </Button>
                  */}
                  
                  {isPublished && (
                    <Button 
                      onClick={handleGenerateQR}
                      variant="outline"
                      size="sm"
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      {language === 'he' ? 'QR Code' : 'QR Code'}
                    </Button>
                  )}
                  
                  {isPublished && (
                    <Button 
                      onClick={handleGenerateEmbed}
                      variant="outline"
                      size="sm"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      {language === 'he' ? 'קוד הטמעה' : 'Embed Code'}
                    </Button>
                  )}
                </div>

                {/* Quick Preview Info */}
                {isPublished && (
                  <div className="text-xs text-gray-600 text-center">
                    {language === 'he' 
                      ? '💡 טיפ: השתמש בתצוגה מקדימה כדי לראות איך השאלון יראה לציבור' 
                      : '💡 Tip: Use the preview to see how the questionnaire will look to the public'
                    }
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sticky Bottom Bar */}
        <PublishBar
          questionnaireId={id}
          criticalIssues={criticalIssues}
          warnings={warnings}
          onContinue={handleContinue}
          onSaveDraft={handleSaveDraft}
          onFinish={handleFinish}
          isSubmitting={isSubmitting}
          // חדש: פונקציות לתצוגה מקדימה
          onPreview={handlePreview}
          onGenerateQR={handleGenerateQR}
          onGenerateEmbed={handleGenerateEmbed}
          isPublished={isPublished}
          publicUrl={publicUrl}
        />
      </div>

      {/* חדש: Modal תצוגה מקדימה */}
      {showPreview && token && (
        <PublicPreviewModal token={token} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
}
