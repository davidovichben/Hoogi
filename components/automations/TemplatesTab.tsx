
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Edit, Trash2, Star, Plus, ChevronDown, Upload, Copy, MessageCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AutomationTemplate {
  id: string;
  name: string;
  message_type: string;
  channels: string[];
  is_default: boolean;
  status?: string;
  sent_count?: number;
  usage_count?: number;
  last_used?: string;
  notes?: string;
  created_at: string;
  subject?: string;
  body?: string;
}

const TemplatesTab = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<AutomationTemplate | null>(null);
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(false);

  // Templates data with loading and error states
  const [templates, setTemplates] = useState<AutomationTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch templates from backend
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('automation_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setTemplates(data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError(err instanceof Error ? err.message : 'Failed to load templates');
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את התבניות. אנא נסה שוב.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTemplates = templates;

  const handleCreateTemplate = () => {
    setIsEditMode(false);
    setCurrentTemplate({
      id: crypto.randomUUID(),
      name: "",
      triggerType: "questionnaire",
      templateType: "standard",
      channel: "email",
      subject: "",
      body: "",
      isDefault: false
    });
    setIsDialogOpen(true);
  };

  const handleEditTemplate = (template: Template) => {
    setIsEditMode(true);
    setCurrentTemplate({...template});
    setIsDialogOpen(true);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק תבנית זו?')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('automation_templates')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      setTemplates(prevTemplates => prevTemplates.filter(template => template.id !== id));
      toast({
        title: "התבנית נמחקה",
        description: "התבנית נמחקה בהצלחה"
      });
    } catch (err) {
      console.error('Error deleting template:', err);
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק את התבנית. אנא נסה שוב.",
        variant: "destructive"
      });
    }
  };

  const handleSetDefault = async (id: string) => {
    const template = templates.find(t => t.id === id);
    if (!template) return;

    try {
      // First, unset all defaults
      await supabase
        .from('automation_templates')
        .update({ is_default: false })
        .eq('is_default', true);

      // Then set the selected template as default
      const { error: updateError } = await supabase
        .from('automation_templates')
        .update({ is_default: true })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      setTemplates(prevTemplates =>
        prevTemplates.map(t => ({
          ...t,
          is_default: t.id === id
        }))
      );
      toast({
        title: "תבנית ברירת מחדל",
        description: "תבנית ברירת המחדל נקבעה בהצלחה"
      });
    } catch (err) {
      console.error('Error setting default template:', err);
      toast({
        title: "שגיאה",
        description: "לא ניתן לקבוע תבנית ברירת מחדל. אנא נסה שוב.",
        variant: "destructive"
      });
    }
  };

  const handleSaveTemplate = async () => {
    if (!currentTemplate) return;

    if (!currentTemplate.name.trim()) {
      toast({
        title: "שגיאה",
        description: "נא להזין שם לתבנית",
        variant: "destructive"
      });
      return;
    }

    if (!currentTemplate.subject || !currentTemplate.subject.trim()) {
      toast({
        title: "שגיאה",
        description: "נא להזין נושא למייל",
        variant: "destructive"
      });
      return;
    }

    if (!currentTemplate.body.trim()) {
      toast({
        title: "שגיאה",
        description: "נא להזין גוף הודעה",
        variant: "destructive"
      });
      return;
    }

    try {
      if (isEditMode) {
        // Update existing template
        const { error: updateError } = await supabase
          .from('templates')
          .update({
            name: currentTemplate.name,
            type: currentTemplate.templateType,
            message_type: currentTemplate.templateType,
            channels: [currentTemplate.channel],
            subject: currentTemplate.subject,
            body: currentTemplate.body,
            is_default: currentTemplate.isDefault,
            reminder_status: currentTemplate.reminderStatus,
            uploaded_image_url: currentTemplate.imageUrl,
            link_url: currentTemplate.fileUrl
          })
          .eq('id', currentTemplate.id);

        if (updateError) {
          throw updateError;
        }

        setTemplates(prevTemplates =>
          prevTemplates.map(template =>
            template.id === currentTemplate.id ? currentTemplate : template
          )
        );
        toast({
          title: "התבנית עודכנה",
          description: "התבנית עודכנה בהצלחה"
        });
      } else {
        // Create new template
        const isFirstOfKind = !templates.some(
          t => t.triggerType === currentTemplate.triggerType && t.channel === currentTemplate.channel
        );

        const { data: newTemplate, error: insertError } = await supabase
          .from('templates')
          .insert({
            name: currentTemplate.name,
            type: currentTemplate.templateType,
            message_type: currentTemplate.templateType,
            personal_message_length: 'medium',
            channels: [currentTemplate.channel],
            subject: currentTemplate.subject,
            body: currentTemplate.body,
            response_type: 'new_customer',
            is_default: isFirstOfKind || currentTemplate.isDefault,
            include_reminder: false,
            ai_decide_enabled: true,
            ai_position: 'start',
            use_profile_logo: true,
            use_profile_image: false,
            reminder_status: currentTemplate.reminderStatus,
            uploaded_image_url: currentTemplate.imageUrl,
            link_url: currentTemplate.fileUrl
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        // Add the newly created template to state
        const mappedTemplate: Template = {
          id: newTemplate.id,
          name: newTemplate.name,
          triggerType: "questionnaire",
          templateType: newTemplate.type || newTemplate.message_type || "standard",
          channel: (newTemplate.channels && newTemplate.channels.length > 0 ? newTemplate.channels[0] : "email"),
          subject: newTemplate.subject || "",
          body: newTemplate.body || "",
          imageUrl: newTemplate.uploaded_image_url || newTemplate.logo_url,
          fileUrl: newTemplate.link_url,
          reminderStatus: newTemplate.reminder_status,
          isDefault: newTemplate.is_default || false
        };

        if (isFirstOfKind || currentTemplate.isDefault) {
          setTemplates(prevTemplates =>
            prevTemplates.map(template =>
              template.triggerType === currentTemplate.triggerType &&
              template.channel === currentTemplate.channel
                ? { ...template, isDefault: false }
                : template
            ).concat(mappedTemplate)
          );
        } else {
          setTemplates(prevTemplates => [...prevTemplates, mappedTemplate]);
        }

        toast({
          title: "התבנית נוצרה",
          description: "התבנית נוצרה בהצלחה"
        });
      }

      setIsDialogOpen(false);
    } catch (err) {
      console.error('Error saving template:', err);
      toast({
        title: "שגיאה",
        description: "לא ניתן לשמור את התבנית. אנא נסה שוב.",
        variant: "destructive"
      });
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6" dir="rtl">
        {/* Header with Create Button */}
        <div className="flex justify-between items-center mb-4" dir="rtl">
          <div>
            <h2 className="text-xl font-semibold text-right">התבניות שלי</h2>
            <p className="text-sm text-muted-foreground text-right">נהל את כל התבניות שלך למענה אוטומטי</p>
          </div>
          <Button
            onClick={handleCreateTemplate}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 ml-2" />
            צור תבנית חדשה
          </Button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500" dir="rtl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-right">טוען תבניות...</p>
          </div>
        ) : error ? (
          /* Error State */
          <Card className="p-8 text-center" dir="rtl">
            <p className="text-red-500 mb-4 text-right">שגיאה בטעינת התבניות</p>
            <Button
              variant="outline"
              onClick={fetchTemplates}
            >
              נסה שוב
            </Button>
          </Card>
        ) : filteredTemplates.length === 0 ? (
          /* Empty State */
          <Card className="p-12 text-center" dir="rtl">
            <div className="flex flex-col items-center gap-4">
              <FileText className="h-16 w-16 text-gray-300" />
              <div>
                <h3 className="text-lg font-semibold mb-2">אין תבניות עדיין</h3>
                <p className="text-muted-foreground mb-4">צור את התבנית הראשונה שלך כדי להתחיל</p>
              </div>
              <Button
                onClick={handleCreateTemplate}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 ml-2" />
                צור תבנית חדשה
              </Button>
            </div>
          </Card>
        ) : (
          /* Templates List */
          <div className="space-y-4" dir="rtl">
            {filteredTemplates.map(template => (
              <Card key={template.id} className={`p-6 hover:shadow-md transition-shadow ${template.is_default ? 'border-primary/50 bg-primary/5' : ''}`} dir="rtl">
                <div className="flex items-start justify-between mb-4" dir="rtl">
                  <div className="flex gap-2 flex-wrap" dir="rtl">
                    {template.is_default && (
                      <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        ברירת מחדל
                      </div>
                    )}
                    <div className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                      template.message_type === 'ai' ? 'bg-green-100 text-green-800 border-green-200' :
                      template.message_type === 'personal' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                      template.message_type === 'combined' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                      'bg-gray-100 text-gray-800 border-gray-200'
                    }`}>
                      {template.message_type === 'ai' ? 'AI' :
                       template.message_type === 'personal' ? 'פנייה אישית' :
                       template.message_type === 'combined' ? 'משולב' :
                       'סטנדרטית'}
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                      template.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'
                    }`}>
                      {template.status === 'active' ? 'פעיל' : 'לא פעיל'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2" dir="rtl">
                    <h3 className="text-lg font-semibold text-right">{template.name}</h3>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600" dir="rtl">
                    <div className="text-right">
                      <span className="font-medium">נוצר: </span>
                      {new Date(template.created_at).toLocaleDateString('he-IL')}
                    </div>
                    <div className="text-right">
                      <span className="font-medium">שימוש אחרון: </span>
                      {template.last_used ? new Date(template.last_used).toLocaleDateString('he-IL') : 'אף פעם'}
                    </div>
                    <div className="text-right">
                      <span className="font-medium">שימושים: </span>
                      {template.usage_count || 0}
                    </div>
                    <div className="text-right">
                      <span className="font-medium">הערות: </span>
                      {template.notes ? '✓' : 'ללא'}
                    </div>
                  </div>

                  <div className="flex gap-2 items-center justify-end text-sm text-gray-600" dir="rtl">
                    <span className="font-medium">ערוצים:</span>
                    {template.channels?.map((channel, idx) => (
                      <span key={idx} className="flex items-center gap-1">
                        {channel === 'email' ? '📧 דוא"ל' : '💬 וואטסאפ'}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap justify-end gap-2 pt-4 border-t" dir="rtl">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Edit className="h-4 w-4 ml-2" />
                      ערוך
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Handle duplicate - you can implement this
                        toast({
                          title: "משכפל תבנית",
                          description: "פיצ'ר זה יתווסף בקרוב"
                        });
                      }}
                    >
                      <Copy className="h-4 w-4 ml-2" />
                      שכפל
                    </Button>

                    {!template.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(template.id)}
                      >
                        <Star className="h-4 w-4 ml-2" />
                        הגדר כברירת מחדל
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4 ml-2" />
                      מחק
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[420px]" dir="rtl">
          <DialogHeader dir="rtl">
            <DialogTitle className="text-right">
              {isEditMode ? "עריכת תבנית" : "יצירת תבנית חדשה"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4" dir="rtl">
            <div dir="rtl">
              <Label htmlFor="template-name" className="text-right">שם תבנית</Label>
              <Input 
                id="template-name"
                value={currentTemplate?.name || ""} 
                onChange={(e) => setCurrentTemplate(prev => 
                  prev ? {...prev, name: e.target.value} : null
                )} 
                placeholder="הזן שם לתבנית"
                dir="rtl"
                className="text-right"
              />
            </div>

            <div dir="rtl">
              <Label htmlFor="template-type" className="text-right">סוג תבנית</Label>
              <Select 
                value={currentTemplate?.templateType || "standard"} 
                onValueChange={(value) => setCurrentTemplate(prev => 
                  prev ? {...prev, templateType: value as Template['templateType']} : null
                )}
              >
                <SelectTrigger id="template-type" className="w-full text-right" dir="rtl">
                  <SelectValue placeholder="בחר סוג תבנית" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">סטנדרטית</SelectItem>
                  <SelectItem value="ai">AI</SelectItem>
                  <SelectItem value="personal">פנייה אישית</SelectItem>
                  <SelectItem value="combined">משולב</SelectItem>
                  <SelectItem value="reminder">תזכורת</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div dir="rtl">
              <Label htmlFor="template-channels" className="text-right">ערוצי שליחה</Label>
              <div className="flex gap-2 justify-end">
                <Button 
                  variant={currentTemplate?.channel === "email" ? "default" : "outline"} 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setCurrentTemplate(prev => 
                    prev ? {...prev, channel: "email"} : null
                  )}
                >
                  מייל
                </Button>
                <Button 
                  variant={currentTemplate?.channel === "whatsapp" ? "default" : "outline"} 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setCurrentTemplate(prev => 
                    prev ? {...prev, channel: "whatsapp"} : null
                  )}
                >
                  וואטסאפ
                </Button>
              </div>
            </div>

            <div dir="rtl">
              <Label htmlFor="template-questionnaire" className="text-right">שאלון</Label>
              <Select 
                value={currentTemplate?.questionnaireId || ""} 
                onValueChange={(value) => setCurrentTemplate(prev => 
                  prev ? {...prev, questionnaireId: value} : null
                )}
              >
                <SelectTrigger id="template-questionnaire" className="w-full text-right" dir="rtl">
                  <SelectValue placeholder="בחר שאלון" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="questionnaire1">שאלון ייעוץ עסקי</SelectItem>
                  <SelectItem value="questionnaire2">שאלון שירותים</SelectItem>
                  <SelectItem value="questionnaire3">שאלון משוב</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div dir="rtl">
              <Label htmlFor="template-reminder" className="text-right">תזכורת</Label>
              <Select 
                value={currentTemplate?.reminderStatus || ""} 
                onValueChange={(value) => setCurrentTemplate(prev => 
                  prev ? {...prev, reminderStatus: value} : null
                )}
              >
                <SelectTrigger id="template-reminder" className="w-full text-right" dir="rtl">
                  <SelectValue placeholder="בחר תזכורת" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ללא תזכורת</SelectItem>
                  <SelectItem value="daily">תזכורת יומית</SelectItem>
                  <SelectItem value="weekly">תזכורת שבועית</SelectItem>
                  <SelectItem value="monthly">תזכורת חודשית</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {currentTemplate?.templateType === "reminder" && (
              <div dir="rtl">
                <Label htmlFor="lead-status" className="text-right">סטטוס ליד</Label>
                <Select 
                  value={currentTemplate?.leadStatus || ""} 
                  onValueChange={(value) => setCurrentTemplate(prev => 
                    prev ? {...prev, leadStatus: value} : null
                  )}
                >
                  <SelectTrigger id="lead-status" className="w-full text-right" dir="rtl">
                    <SelectValue placeholder="בחר סטטוס ליד" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">חדש</SelectItem>
                    <SelectItem value="contacted">יצר קשר</SelectItem>
                    <SelectItem value="qualified">מוסמך</SelectItem>
                    <SelectItem value="proposal">הצעה</SelectItem>
                    <SelectItem value="negotiation">משא ומתן</SelectItem>
                    <SelectItem value="closed">סגור</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div dir="rtl">
              <Label htmlFor="email-subject" className="text-right">נושא מייל</Label>
              <Input 
                id="email-subject"
                value={currentTemplate?.subject || ""} 
                onChange={(e) => setCurrentTemplate(prev => 
                  prev ? {...prev, subject: e.target.value} : null
                )} 
                placeholder="הזן נושא למייל"
                dir="rtl"
                className="text-right"
              />
            </div>

            <div dir="rtl">
              <Label htmlFor="message-body" className="text-right">גוף ההודעה (עד 2 שורות)</Label>
              <Textarea 
                id="message-body"
                value={currentTemplate?.body || ""} 
                onChange={(e) => setCurrentTemplate(prev => 
                  prev ? {...prev, body: e.target.value} : null
                )} 
                className="min-h-[60px] max-h-[60px] resize-none text-right"
                placeholder="הזן את תוכן ההודעה (עד 2 שורות)"
                dir="rtl"
                rows={2}
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                מוגבל ל-2 שורות בלבד
              </p>
            </div>

            <div dir="rtl">
              <Label htmlFor="template-link" className="text-right">קישור (אופציונלי)</Label>
              <Input 
                id="template-link"
                value={currentTemplate?.imageUrl || ""} 
                onChange={(e) => setCurrentTemplate(prev => 
                  prev ? {...prev, imageUrl: e.target.value} : null
                )} 
                placeholder="https://example.com"
                dir="ltr"
                className="text-left"
              />
            </div>

            <div dir="rtl">
              <Label htmlFor="template-file" className="text-right">העלאת קובץ (אופציונלי)</Label>
              <Input 
                id="template-file"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setCurrentTemplate(prev => 
                      prev ? {...prev, fileUrl: file.name} : null
                    );
                    toast({
                      title: "קובץ נבחר",
                      description: `הקובץ ${file.name} נבחר בהצלחה`
                    });
                  }
                }}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                ניתן להעלות תמונות או מסמכי PDF
              </p>
            </div>

            {currentTemplate?.templateType !== 'standard' && (
              <div dir="rtl">
                <Label htmlFor="file-upload" className="text-right">העלאת קובץ או תמונה</Label>
                <Input 
                  id="file-upload"
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Here you would typically upload the file and get a URL
                      // For now, we'll just store the file name
                      setCurrentTemplate(prev => 
                        prev ? {...prev, imageUrl: file.name} : null
                      );
                      toast({
                        title: "קובץ נבחר",
                        description: `הקובץ ${file.name} נבחר בהצלחה`
                      });
                    }
                  }}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  ניתן להעלות תמונות או קבצי PDF, Word
                </p>
                {currentTemplate?.imageUrl && (
                  <p className="text-xs text-primary mt-2 text-right">
                    קובץ נבחר: {currentTemplate.imageUrl}
                  </p>
                )}
              </div>
            )}

            <Collapsible
              open={isCollapsibleOpen}
              onOpenChange={setIsCollapsibleOpen}
              className="w-full"
              dir="rtl"
            >
              <CollapsibleTrigger asChild>
                <div className="flex items-center text-sm text-blue-600 cursor-pointer justify-end">
                  <ChevronDown className={`h-4 w-4 transition-transform ${isCollapsibleOpen ? 'transform rotate-180' : ''}`} />
                  <span className="mr-1">משתנים נתמכים</span>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 p-2 bg-gray-50 rounded-md text-sm" dir="rtl">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-100 px-2 py-1 rounded">{"{{firstName}}"}</div>
                  <div className="bg-gray-100 px-2 py-1 rounded">{"{{lastName}}"}</div>
                  <div className="bg-gray-100 px-2 py-1 rounded">{"{{businessName}}"}</div>
                  <div className="bg-gray-100 px-2 py-1 rounded">{"{{leadSource}}"}</div>
                  <div className="bg-gray-100 px-2 py-1 rounded">{"{{date}}"}</div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex items-center space-x-2 rtl:space-x-reverse justify-end" dir="rtl">
              <Switch 
                id="is-default"
                checked={currentTemplate?.isDefault || false}
                onCheckedChange={(checked) => setCurrentTemplate(prev => 
                  prev ? {...prev, isDefault: checked} : null
                )}
              />
              <Label htmlFor="is-default" className="text-right">הפוך לברירת-מחדל לערוץ זה</Label>
            </div>
          </div>

          <DialogFooter dir="rtl">
            <Button variant="outline" asChild>
              <DialogClose>ביטול</DialogClose>
            </Button>
            <Button onClick={handleSaveTemplate}>
              {isEditMode ? "עדכון" : "שמירה"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default TemplatesTab;
