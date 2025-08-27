import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { ArrowLeft, FileText, Plus, Eye, Edit, Share2, QrCode, BarChart3, Globe } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { useLanguage } from "../contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { buildPublicUrl } from "../lib/publicUrl";
import { QRModal } from "../components/QRModal";

interface Questionnaire {
  id: string;
  title?: string;
  name?: string;
  questionnaire_title?: string;
  questionnaire_name?: string;
  category?: string;
  status?: string;
  created_at: string;
  updated_at?: string;
  is_published?: boolean;
  public_token?: string;
  default_lang?: string;
  meta?: {
    title?: string;
    name?: string;
  };
}

export default function QuestionnaireReviewPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useLanguage();
  
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<Questionnaire | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Load questionnaires on component mount
  useEffect(() => {
    loadQuestionnaires();
  }, []);

  // Load selected questionnaire details when selection changes
  useEffect(() => {
    if (selectedQuestionnaireId) {
      const questionnaire = questionnaires.find(q => q.id === selectedQuestionnaireId);
      console.log('🎯 Selected questionnaire:', questionnaire);
      setSelectedQuestionnaire(questionnaire || null);
    } else {
      setSelectedQuestionnaire(null);
    }
  }, [selectedQuestionnaireId, questionnaires]);

  const loadQuestionnaires = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading questionnaires...');
      
      // בדיקה אם Supabase מחובר
      console.log('🔗 Supabase client:', supabase);
      console.log('🌐 Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      
      // נסה לטעון את השאלונים עם כל השדות
      const { data, error } = await supabase
        .from('questionnaires')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📊 Supabase response:', { data, error });

      if (error) {
        console.error('❌ Error loading questionnaires:', error);
        throw error;
      }

      console.log('✅ Questionnaires loaded:', data);
      
      // בדוק אם הנתונים הגיעו עם כותרות
      if (data && data.length > 0) {
        console.log('🔍 First questionnaire data:', data[0]);
        console.log('📝 All titles:', data.map(q => ({ 
          id: q.id, 
          title: q.title, 
          name: q.name, 
          questionnaire_title: q.questionnaire_title,
          questionnaire_name: q.questionnaire_name,
          meta: q.meta 
        })));
        
        // בדוק איזה שדה מכיל את הכותרת
        const firstQ = data[0];
        console.log('🔍 Title field check:', {
          'title': firstQ.title,
          'name': firstQ.name,
          'questionnaire_title': firstQ.questionnaire_title,
          'questionnaire_name': firstQ.questionnaire_name,
          'meta.title': firstQ.meta?.title,
          'meta.name': firstQ.meta?.name,
          'hasTitle': !!firstQ.title,
          'hasName': !!firstQ.name,
          'hasQuestionnaireTitle': !!firstQ.questionnaire_title,
          'hasQuestionnaireName': !!firstQ.questionnaire_name,
          'hasMetaTitle': !!firstQ.meta?.title,
          'hasMetaName': !!firstQ.meta?.name
        });
        
        // בדוק את כל השדות הקיימים
        console.log('🔍 All available fields:', Object.keys(firstQ));
      }
      
      setQuestionnaires(data || []);
      
      // אם אין נתונים, נציג נתונים לדוגמה לבדיקה
      if (!data || data.length === 0) {
        console.log('⚠️ No questionnaires found, showing demo data');
        const demoData = [
          {
            id: 'demo-1',
            title: 'שאלון לדוגמה 1',
            category: 'ביטוח',
            status: 'draft',
            created_at: new Date().toISOString(),
            is_published: false,
            public_token: null
          },
          {
            id: 'demo-2', 
            title: 'שאלון לדוגמה 2',
            category: 'נסיעות',
            status: 'published',
            created_at: new Date().toISOString(),
            is_published: true,
            public_token: 'demo-token'
          }
        ];
        setQuestionnaires(demoData);
      }
    } catch (error: any) {
      console.error('❌ Error loading questionnaires:', error);
      
      // במקרה של שגיאה, נציג נתונים לדוגמה
      console.log('🔄 Showing demo data due to error');
      const demoData = [
        {
          id: 'demo-error-1',
          title: 'שאלון לדוגמה (שגיאה)',
          category: 'כללי',
          status: 'draft',
          created_at: new Date().toISOString(),
          is_published: false,
          public_token: null
        }
      ];
      setQuestionnaires(demoData);
      
      toast({
        title: language === 'he' ? 'שגיאה בטעינה' : 'Loading Error',
        description: language === 'he' 
          ? 'לא ניתן היה לטעון את השאלונים - מציג נתונים לדוגמה' 
          : 'Could not load questionnaires - showing demo data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    navigate('/onboarding?step=1');
  };

  const handleReview = () => {
    if (selectedQuestionnaireId) {
      // עדיפות ל-public_token אם קיים
      const selectedQuestionnaire = questionnaires.find(q => q.id === selectedQuestionnaireId);
      const qid = selectedQuestionnaire?.public_token || selectedQuestionnaireId;
      navigate(`/distribute`);
    }
  };

  const handleEdit = () => {
    if (selectedQuestionnaireId) {
      navigate(`/onboarding?step=2&id=${selectedQuestionnaireId}`);
    }
  };

  const handlePreview = () => {
    if (selectedQuestionnaireId) {
      // Redirect to new distribute route instead of old preview route
      // עדיפות ל-public_token אם קיים
      const selectedQuestionnaire = questionnaires.find(q => q.id === selectedQuestionnaireId);
      const qid = selectedQuestionnaire?.public_token || selectedQuestionnaireId;
      navigate(`/distribute`);
    }
  };

  const handleShare = () => {
    if (selectedQuestionnaireId) {
      // Redirect to new distribute route instead of old share route
      // עדיפות ל-public_token אם קיים
      const selectedQuestionnaire = questionnaires.find(q => q.id === selectedQuestionnaireId);
      const qid = selectedQuestionnaire?.public_token || selectedQuestionnaireId;
      navigate(`/distribute`);
    }
  };

  const handleResponses = () => {
    if (selectedQuestionnaireId) {
      navigate(`/responses?questionnaireId=${selectedQuestionnaireId}`);
    }
  };

  const handlePublish = async () => {
    if (!selectedQuestionnaire) return;
    
    try {
      setPublishing(true);
      
      // Update the questionnaire to published status
      const { error } = await supabase
        .from('questionnaires')
        .update({ 
          is_published: true,
          public_token: selectedQuestionnaire.public_token || `token-${Date.now()}`,
          default_lang: selectedQuestionnaire.default_lang || 'he'
        })
        .eq('id', selectedQuestionnaire.id);

      if (error) throw error;

      // Refresh the questionnaires list
      await loadQuestionnaires();
      
      toast({
        title: language === 'he' ? 'השאלון פורסם!' : 'Questionnaire Published!',
        description: language === 'he' 
          ? 'השאלון זמין כעת לציבור' 
          : 'The questionnaire is now available to the public',
      });
    } catch (error: any) {
      console.error('Error publishing questionnaire:', error);
      toast({
        title: language === 'he' ? 'שגיאה בפרסום' : 'Publish Error',
        description: language === 'he' 
          ? 'לא ניתן היה לפרסם את השאלון' 
          : 'Could not publish the questionnaire',
        variant: 'destructive'
      });
    } finally {
      setPublishing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background" dir={language === 'he' ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
                  </div>
      </div>

      {/* QR Modal */}
      <QRModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        value={selectedQuestionnaire?.public_token ? buildPublicUrl(selectedQuestionnaire.public_token, selectedQuestionnaire.default_lang as 'he' | 'en') : ''}
        title={language === 'he' ? 'QR Code' : 'QR Code'}
      />
    </div>
  );
}

  return (
    <div className="min-h-screen bg-background" dir={language === 'he' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
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

          <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <FileText className="h-7 w-7" />
                <span>
                  {language === 'he' ? 'סקירת שאלונים' : 'Questionnaire Review'}
                </span>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {language === 'he' ? 'בחר שאלון' : 'Select Questionnaire'}
                </Badge>
              </CardTitle>
              <CardDescription className="text-lg">
                {language === 'he' 
                  ? 'בחר שאלון לסקירה, עריכה או ניהול' 
                  : 'Select a questionnaire for review, editing, or management'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Questionnaire Selector */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Select
                    value={selectedQuestionnaireId}
                    onValueChange={setSelectedQuestionnaireId}
                  >
                    <SelectTrigger className="w-80">
                      <SelectValue 
                        placeholder={language === 'he' ? 'בחר שאלון...' : 'Select questionnaire...'} 
                      />
                    </SelectTrigger>
                                         <SelectContent>
                       {questionnaires.length === 0 ? (
                         <SelectItem value="" disabled>
                           {language === 'he' ? 'אין שאלונים' : 'No questionnaires'}
                         </SelectItem>
                       ) : (
                         questionnaires.map((questionnaire) => {
                           console.log('📝 Rendering questionnaire option:', questionnaire);
                           return (
                             <SelectItem key={questionnaire.id} value={questionnaire.id}>
                               <div className="flex items-center gap-2">
                                 <span className="font-medium">
                                 {questionnaire.title || 
                                  questionnaire.name || 
                                  questionnaire.questionnaire_title || 
                                  questionnaire.questionnaire_name ||
                                  (questionnaire.meta && questionnaire.meta.title) ||
                                  (questionnaire.meta && questionnaire.meta.name) ||
                                  (language === 'he' ? 'ללא כותרת' : 'Untitled')}
                               </span>
                                 {questionnaire.is_published && (
                                   <Badge variant="default" className="text-xs">
                                     {language === 'he' ? 'פורסם' : 'Published'}
                                   </Badge>
                                 )}
                               </div>
                             </SelectItem>
                           );
                         })
                       )}
                     </SelectContent>
                  </Select>

                  <Button onClick={handleCreateNew} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {language === 'he' ? 'צור חדש' : 'Create New'}
                  </Button>
                </div>

                {/* No Questionnaires Message */}
                {questionnaires.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      {language === 'he' ? 'אין שאלונים' : 'No Questionnaires'}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {language === 'he' 
                        ? 'עדיין לא יצרת שאלונים. צור שאלון ראשון כדי להתחיל!' 
                        : 'You haven\'t created any questionnaires yet. Create your first one to get started!'
                      }
                    </p>
                    <Button onClick={handleCreateNew} size="lg" className="gap-2">
                      <Plus className="h-5 w-5" />
                      {language === 'he' ? 'צור שאלון ראשון' : 'Create First Questionnaire'}
                    </Button>
                  </div>
                )}

                {/* Selected Questionnaire Details */}
                {selectedQuestionnaire && (
                  <Card className="border border-border">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {language === 'he' ? 'פרטי השאלון הנבחר' : 'Selected Questionnaire Details'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                          <span className="font-medium">
                            {language === 'he' ? 'כותרת:' : 'Title:'}
                          </span>
                          <p className="text-muted-foreground">
                            {selectedQuestionnaire.title || (language === 'he' ? 'ללא כותרת' : 'Untitled')}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium">
                            {language === 'he' ? 'קטגוריה:' : 'Category:'}
                          </span>
                          <p className="text-muted-foreground">
                            {selectedQuestionnaire.category || (language === 'he' ? 'לא נבחרה' : 'Not selected')}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium">
                            {language === 'he' ? 'סטטוס:' : 'Status:'}
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={selectedQuestionnaire.is_published ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {selectedQuestionnaire.is_published 
                                ? (language === 'he' ? 'פורסם' : 'Published')
                                : (language === 'he' ? 'טיוטה' : 'Draft')
                              }
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">
                            {language === 'he' ? 'נוצר:' : 'Created:'}
                          </span>
                          <p className="text-muted-foreground">
                            {formatDate(selectedQuestionnaire.created_at)}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3">
                        <Button onClick={handleReview} variant="default" className="gap-2">
                          <Eye className="h-4 w-4" />
                          {language === 'he' ? 'סקירה ופרסום' : 'Review & Publish'}
                        </Button>
                        
                        <Button onClick={handleEdit} variant="outline" className="gap-2">
                          <Edit className="h-4 w-4" />
                          {language === 'he' ? 'ערוך' : 'Edit'}
                        </Button>
                        
                        {/* Hidden: Old preview button - replaced by /distribute route
                        <Button onClick={handlePreview} variant="outline" className="gap-2">
                          <Eye className="h-4 w-4" />
                          {language === 'he' ? 'תצוגה מקדימה' : 'Preview'}
                        </Button>
                        */}
                        
                        {/* Hidden: Old share button - replaced by /distribute route
                        <Button onClick={handleShare} variant="outline" className="gap-2">
                          <Share2 className="h-4 w-4" />
                          {language === 'he' ? 'שתף' : 'Share'}
                        </Button>
                        */}
                        
                        <Button onClick={handleResponses} variant="outline" className="gap-2">
                          <BarChart3 className="h-4 w-4" />
                          {language === 'he' ? 'תגובות' : 'Responses'}
                        </Button>
                      </div>

                      {/* Public Link Section */}
                      {selectedQuestionnaire && (
                        <div className="mt-6 p-4 bg-muted rounded-lg">
                          <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <Globe className="h-5 w-5" />
                            {language === 'he' ? 'קישור ציבורי' : 'Public Link'}
                          </h3>
                          {selectedQuestionnaire.is_published && selectedQuestionnaire.public_token ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={buildPublicUrl(selectedQuestionnaire.public_token, selectedQuestionnaire.default_lang as 'he' | 'en')}
                                  readOnly
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                                />
                                <Button
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      buildPublicUrl(selectedQuestionnaire.public_token!, selectedQuestionnaire.default_lang as 'he' | 'en')
                                    );
                                    toast({
                                      title: language === 'he' ? 'הועתק!' : 'Copied!',
                                      description: language === 'he' ? 'הקישור הועתק ללוח' : 'Link copied to clipboard',
                                    });
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className="whitespace-nowrap"
                                >
                                  {language === 'he' ? 'העתק' : 'Copy'}
                                </Button>
                                <Button
                                  onClick={() => setShowQRModal(true)}
                                  variant="outline"
                                  size="sm"
                                  className="whitespace-nowrap"
                                >
                                  <QrCode className="h-4 w-4 mr-2" />
                                  {language === 'he' ? 'QR Code' : 'QR Code'}
                                </Button>
                              </div>
                              <p className="text-sm text-green-600 text-center">
                                {language === 'he' 
                                  ? '✅ השאלון פורסם וזמין לציבור' 
                                  : '✅ Questionnaire is published and available to the public'
                                }
                              </p>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-muted-foreground mb-3">
                                {language === 'he' 
                                  ? 'אין קישור—פרסמי קודם' 
                                  : 'No link—publish first'
                                }
                              </p>
                              <Button
                                onClick={handlePublish}
                                disabled={publishing}
                                variant="default"
                                size="sm"
                                className="gap-2"
                              >
                                {publishing ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    {language === 'he' ? 'מפרסם...' : 'Publishing...'}
                                  </>
                                ) : (
                                  <>
                                    <Globe className="h-4 w-4" />
                                    {language === 'he' ? 'פרסם' : 'Publish'}
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Quick Stats */}
                {questionnaires.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-primary">
                          {questionnaires.length}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {language === 'he' ? 'סה"כ שאלונים' : 'Total Questionnaires'}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {questionnaires.filter(q => q.is_published).length}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {language === 'he' ? 'שאלונים שפורסמו' : 'Published'}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {questionnaires.filter(q => !q.is_published).length}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {language === 'he' ? 'טיוטות' : 'Drafts'}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {questionnaires.filter(q => q.public_token).length}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {language === 'he' ? 'עם קישור ציבורי' : 'With Public Link'}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* QR Modal */}
      <QRModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        value={selectedQuestionnaire?.public_token ? buildPublicUrl(selectedQuestionnaire.public_token, selectedQuestionnaire.default_lang as 'he' | 'en') : ''}
        title={language === 'he' ? 'QR Code' : 'QR Code'}
      />
    </div>
  );
}
