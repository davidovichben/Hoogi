
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
import { Edit, Trash2, Star, Plus, ChevronDown, Upload } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Template {
  id: string;
  name: string;
  triggerType: "questionnaire" | "comment" | "reminder";
  templateType: "ai" | "personal" | "combined" | "standard" | "reminder";
  channel: "email" | "whatsapp";
  subject?: string;
  body: string;
  imageUrl?: string;
  fileUrl?: string;
  questionnaireId?: string;
  reminderStatus?: string;
  leadStatus?: string;
  isDefault: boolean;
}

const TemplatesTab = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(false);
  
  // Sample templates data
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: "1",
      name: "תבנית שאלון סטנדרטית",
      triggerType: "questionnaire",
      templateType: "standard",
      channel: "email",
      subject: "קיבלנו את השאלון שלך - {{businessName}}",
      body: "שלום {{firstName}},\n\nתודה שמילאת את השאלון שלנו.\nפנייתך התקבלה ואנו נחזור אליך בהקדם.\n\nבברכה,\n{{businessName}}",
      isDefault: true
    },
    {
      id: "2",
      name: "תבנית שאלון AI",
      triggerType: "questionnaire",
      templateType: "ai",
      channel: "email",
      subject: "תשובה אוטומטית לשאלון שלך",
      body: "תוכן זה ייווצר באופן אוטומטי על ידי AI בהתאם לתשובות בשאלון",
      isDefault: false
    },
    {
      id: "3",
      name: "תבנית תגובה רגילה",
      triggerType: "comment",
      templateType: "standard",
      channel: "email",
      subject: "תודה על התגובה שלך",
      body: "שלום {{firstName}},\n\nתודה על התגובה שלך.\nצוות התוכן שלנו יבחן את התגובה בהקדם.\n\nבברכה,\n{{businessName}}",
      isDefault: true
    }
  ]);

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

  const handleDeleteTemplate = (id: string) => {
    setTemplates(prevTemplates => prevTemplates.filter(template => template.id !== id));
    toast({
      title: "התבנית נמחקה",
      description: "התבנית נמחקה בהצלחה"
    });
  };

  const handleSetDefault = (id: string) => {
    const template = templates.find(t => t.id === id);
    if (!template) return;
    
    setTemplates(prevTemplates => 
      prevTemplates.map(t => 
        t.triggerType === template.triggerType && t.channel === template.channel
          ? { ...t, isDefault: t.id === id }
          : t
      )
    );
    toast({
      title: "תבנית ברירת מחדל",
      description: "תבנית ברירת המחדל נקבעה בהצלחה"
    });
  };

  const handleSaveTemplate = () => {
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

    if (isEditMode) {
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
      // If this is the first template of its kind, make it default
      const isFirstOfKind = !templates.some(
        t => t.triggerType === currentTemplate.triggerType && t.channel === currentTemplate.channel
      );
      
      if (isFirstOfKind || currentTemplate.isDefault) {
        // If this template is marked as default, unmark other templates of the same type/channel
        setTemplates(prevTemplates => 
          prevTemplates.map(template => 
            template.triggerType === currentTemplate.triggerType && 
            template.channel === currentTemplate.channel
              ? { ...template, isDefault: false }
              : template
          ).concat({...currentTemplate, isDefault: isFirstOfKind || currentTemplate.isDefault})
        );
      } else {
        setTemplates(prevTemplates => [...prevTemplates, currentTemplate]);
      }
      
      toast({
        title: "התבנית נוצרה",
        description: "התבנית נוצרה בהצלחה"
      });
    }

    setIsDialogOpen(false);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6" dir="rtl">
      {/* Create Template Button - Top */}
      <div className="flex justify-start mb-4">
        <Button 
          onClick={handleCreateTemplate}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 ml-2" />
          צור תבנית חדשה
        </Button>
      </div>

      {/* Standard Template - Inline Editing */}
      <Card className="p-6 bg-primary/5 border-primary/20" dir="rtl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">תבנית סטנדרטית</h2>
          </div>
          <div className="bg-primary text-primary-foreground px-3 py-1 rounded-lg text-sm font-medium">
            תבנית סטנדרט
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>נושא ההודעה</Label>
              <Input 
                value="קיבלנו את השאלון שלך - {{businessName}}"
                className="text-right"
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label>ערוץ שליחה</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">מייל</Button>
                <Button variant="outline" size="sm" className="flex-1">וואטסאפ</Button>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>תוכן ההודעה (עד 2 שורות)</Label>
            <Textarea 
              value="שלום {{firstName}},\nתודה שמילאת את השאלון שלנו. פנייתך התקבלה ואנו נחזור אליך בהקדם."
              className="min-h-[60px] max-h-[60px] resize-none text-right"
              rows={2}
            />
            <p className="text-xs text-muted-foreground">מוגבל ל-2 שורות בלבד</p>
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 ml-2" />
              ערוך תשובה
            </Button>
          </div>
        </div>
      </Card>

      {/* Template Builder */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">בניית תבניות</h2>
          <p className="text-muted-foreground">צור תבניות מותאמות אישית למענה אוטומטי</p>
        </div>

        {/* AI Template Options */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg mb-6 border border-blue-200" dir="rtl">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
            <h3 className="text-lg font-semibold">תבנית AI</h3>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>מיקום תגובת AI</Label>
                <Select>
                  <SelectTrigger className="text-right">
                    <SelectValue placeholder="בחר מיקום" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginning">בתחילת התשובה</SelectItem>
                    <SelectItem value="middle">באמצע התשובה</SelectItem>
                    <SelectItem value="end">בסוף התשובה</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>ערוצי שליחה</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">מייל</Button>
                  <Button variant="outline" size="sm" className="flex-1">וואטסאפ</Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>קישור (אופציונלי)</Label>
                <Input 
                  placeholder="https://example.com"
                  className="text-right"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>העלאת קובץ (אופציונלי)</Label>
              <div className="flex gap-2">
                <Input 
                  type="file"
                  accept="image/*,.pdf"
                  className="flex-1"
                />
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 ml-1" />
                  בחר קובץ
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">ניתן להעלות תמונות או מסמכי PDF</p>
            </div>
            
            <div className="space-y-2">
              <Label>הודעת AI מותאמת אישית</Label>
              <Textarea 
                placeholder="כתוב כאן את ההודעה שתופיע לפני או אחרי תגובת ה-AI..."
                className="min-h-[80px] text-right"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end">
              <Button className="bg-blue-500 text-white hover:bg-blue-600">
                <Plus className="h-4 w-4 ml-2" />
                צור תבנית AI
              </Button>
            </div>
          </div>
        </div>

        <div className="border rounded-md mb-6" dir="rtl">
          <div className="p-4 border-b flex items-center justify-between bg-gray-50">
            <h3 className="font-medium text-right">תבניות קיימות</h3>
          </div>
          
          <div className="divide-y">
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map(template => (
                <div key={template.id} className="p-4 flex items-center justify-between hover:bg-gray-50" dir="rtl">
                  <div className="flex items-center gap-3 flex-1">
                    {template.isDefault && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Star className="h-4 w-4 text-yellow-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>ברירת מחדל</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    <div className="flex-1 text-right">
                      <div className="font-medium">{template.name}</div>
                      <div className="flex gap-2 mt-1 text-xs text-gray-500 justify-end">
                        <span>סוג: {
                          template.templateType === 'ai' ? 'AI' :
                          template.templateType === 'personal' ? 'פנייה אישית' :
                          template.templateType === 'combined' ? 'משולב' :
                          'סטנדרטית'
                        }</span>
                        <span>•</span>
                        <span>ערוץ: {template.channel === 'email' ? 'דוא"ל' : 'וואטסאפ'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 rtl:space-x-reverse">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>ערוך</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>מחק</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    {!template.isDefault && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleSetDefault(template.id)}
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>הגדר כברירת מחדל</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500" dir="rtl">
                <p>אין תבניות עדיין עבור הקטגוריה הזו</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCreateTemplate}
                  className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90 border-primary"
                >
                  צור תבנית חדשה
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "עריכת תבנית" : "יצירת תבנית חדשה"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="template-name">שם תבנית</Label>
              <Input 
                id="template-name"
                value={currentTemplate?.name || ""} 
                onChange={(e) => setCurrentTemplate(prev => 
                  prev ? {...prev, name: e.target.value} : null
                )} 
                placeholder="הזן שם לתבנית"
                dir="rtl"
              />
            </div>

            <div>
              <Label htmlFor="template-type">סוג תבנית</Label>
              <Select 
                value={currentTemplate?.templateType || "standard"} 
                onValueChange={(value) => setCurrentTemplate(prev => 
                  prev ? {...prev, templateType: value as Template['templateType']} : null
                )}
              >
                <SelectTrigger id="template-type" className="w-full">
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

            <div>
              <Label htmlFor="template-channels">ערוצי שליחה</Label>
              <div className="flex gap-2">
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

            <div>
              <Label htmlFor="template-questionnaire">שאלון</Label>
              <Select 
                value={currentTemplate?.questionnaireId || ""} 
                onValueChange={(value) => setCurrentTemplate(prev => 
                  prev ? {...prev, questionnaireId: value} : null
                )}
              >
                <SelectTrigger id="template-questionnaire" className="w-full">
                  <SelectValue placeholder="בחר שאלון" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="questionnaire1">שאלון ייעוץ עסקי</SelectItem>
                  <SelectItem value="questionnaire2">שאלון שירותים</SelectItem>
                  <SelectItem value="questionnaire3">שאלון משוב</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="template-reminder">תזכורת</Label>
              <Select 
                value={currentTemplate?.reminderStatus || ""} 
                onValueChange={(value) => setCurrentTemplate(prev => 
                  prev ? {...prev, reminderStatus: value} : null
                )}
              >
                <SelectTrigger id="template-reminder" className="w-full">
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
              <div>
                <Label htmlFor="lead-status">סטטוס ליד</Label>
                <Select 
                  value={currentTemplate?.leadStatus || ""} 
                  onValueChange={(value) => setCurrentTemplate(prev => 
                    prev ? {...prev, leadStatus: value} : null
                  )}
                >
                  <SelectTrigger id="lead-status" className="w-full">
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

            <div>
              <Label htmlFor="email-subject">נושא מייל</Label>
              <Input 
                id="email-subject"
                value={currentTemplate?.subject || ""} 
                onChange={(e) => setCurrentTemplate(prev => 
                  prev ? {...prev, subject: e.target.value} : null
                )} 
                placeholder="הזן נושא למייל"
                dir="rtl"
              />
            </div>

            <div>
              <Label htmlFor="message-body">גוף ההודעה (עד 2 שורות)</Label>
              <Textarea 
                id="message-body"
                value={currentTemplate?.body || ""} 
                onChange={(e) => setCurrentTemplate(prev => 
                  prev ? {...prev, body: e.target.value} : null
                )} 
                className="min-h-[60px] max-h-[60px] resize-none"
                placeholder="הזן את תוכן ההודעה (עד 2 שורות)"
                dir="rtl"
                rows={2}
              />
              <p className="text-xs text-muted-foreground mt-1">
                מוגבל ל-2 שורות בלבד
              </p>
            </div>

            <div>
              <Label htmlFor="template-link">קישור (אופציונלי)</Label>
              <Input 
                id="template-link"
                value={currentTemplate?.imageUrl || ""} 
                onChange={(e) => setCurrentTemplate(prev => 
                  prev ? {...prev, imageUrl: e.target.value} : null
                )} 
                placeholder="https://example.com"
                dir="rtl"
              />
            </div>

            <div>
              <Label htmlFor="template-file">העלאת קובץ (אופציונלי)</Label>
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
              <p className="text-xs text-muted-foreground mt-1">
                ניתן להעלות תמונות או מסמכי PDF
              </p>
            </div>

            {currentTemplate?.templateType !== 'standard' && (
              <div>
                <Label htmlFor="file-upload">העלאת קובץ או תמונה</Label>
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
                <p className="text-xs text-muted-foreground mt-1">
                  ניתן להעלות תמונות או קבצי PDF, Word
                </p>
                {currentTemplate?.imageUrl && (
                  <p className="text-xs text-primary mt-2">
                    קובץ נבחר: {currentTemplate.imageUrl}
                  </p>
                )}
              </div>
            )}

            <Collapsible
              open={isCollapsibleOpen}
              onOpenChange={setIsCollapsibleOpen}
              className="w-full"
            >
              <CollapsibleTrigger asChild>
                <div className="flex items-center text-sm text-blue-600 cursor-pointer">
                  <ChevronDown className={`h-4 w-4 transition-transform ${isCollapsibleOpen ? 'transform rotate-180' : ''}`} />
                  <span className="mr-1">משתנים נתמכים</span>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 p-2 bg-gray-50 rounded-md text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-100 px-2 py-1 rounded">{"{{firstName}}"}</div>
                  <div className="bg-gray-100 px-2 py-1 rounded">{"{{lastName}}"}</div>
                  <div className="bg-gray-100 px-2 py-1 rounded">{"{{businessName}}"}</div>
                  <div className="bg-gray-100 px-2 py-1 rounded">{"{{leadSource}}"}</div>
                  <div className="bg-gray-100 px-2 py-1 rounded">{"{{date}}"}</div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Switch 
                id="is-default"
                checked={currentTemplate?.isDefault || false}
                onCheckedChange={(checked) => setCurrentTemplate(prev => 
                  prev ? {...prev, isDefault: checked} : null
                )}
              />
              <Label htmlFor="is-default">הפוך לברירת-מחדל לערוץ זה</Label>
            </div>
          </div>

          <DialogFooter>
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
