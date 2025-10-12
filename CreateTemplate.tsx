import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Plus, 
  Sparkles, 
  Mail, 
  MessageCircle, 
  FileText, 
  Upload, 
  ArrowRight, 
  Wand2,
  Palette,
  Link as LinkIcon,
  Image,
  Star,
  Clock,
  Users,
  Edit,
  Eye,
  Bell,
  Trash2,
  MessageSquare,
  Copy,
  MoreVertical
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface TemplateDesign {
  logoUrl: string;
  profileImageUrl: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  linkUrl: string;
  documentUrl: string;
}

const CreateTemplate = () => {
  const navigate = useNavigate();
  
  // Basic template info
  const [templateName, setTemplateName] = useState("");
  const [templateType, setTemplateType] = useState<"standard" | "ai" | "personal" | "combined">("standard");
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [singleChannel, setSingleChannel] = useState<"email" | "whatsapp">("email");
  
  // Message content
  const [emailSubject, setEmailSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [emailBody, setEmailBody] = useState("");
  
  // Standard template specific
  const [responseType, setResponseType] = useState<"new_customer" | "reminder">("new_customer");
  const [reminderDays, setReminderDays] = useState<number>(7);
  const [reminderTime, setReminderTime] = useState<string>("09:00");
  const [leadStatus, setLeadStatus] = useState<string>("");
  const [leadSubStatus, setLeadSubStatus] = useState<string>("");
  const [reminderDelay, setReminderDelay] = useState<string>("");
  const [reminderYear, setReminderYear] = useState<string>("");
  
  // AI template specific
  const [aiPosition, setAiPosition] = useState<"start" | "middle" | "end">("start");
  const [customAiMessage, setCustomAiMessage] = useState("");
  
  // Combined template design
  const [templateDesign, setTemplateDesign] = useState<TemplateDesign>({
    logoUrl: "",
    profileImageUrl: "",
    primaryColor: "#3B82F6",
    secondaryColor: "#8B5CF6",
    backgroundColor: "#F3F7FC",
    linkUrl: "",
    documentUrl: ""
  });
  
  // File uploads
  const [logoFile, setLogoFile] = useState<string>("");
  
  // Demo modal
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [selectedChannelForDemo, setSelectedChannelForDemo] = useState<string>("");
  const [profileFile, setProfileFile] = useState<string>("");
  
  // Tab state
  const [activeTab, setActiveTab] = useState<"templates" | "notifications" | "my-templates">("templates");
  
  // Edit mode state
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Notification timing state
  const [notificationTiming, setNotificationTiming] = useState({
    frequency: "daily", // hourly, daily, every3days, weekly, monthly
    time: "09:00",
    enabled: true
  });
  const [documentFile, setDocumentFile] = useState<string>("");
  
  // Include logo/profile checkboxes
  const [includeLogo, setIncludeLogo] = useState(true);
  const [includeProfile, setIncludeProfile] = useState(true);
  
  // AI decision buttons
  const [aiDecideForAI, setAiDecideForAI] = useState(true);
  const [aiDecideForCombined, setAiDecideForCombined] = useState(true);
  
  // AI decision checkbox - controls both title and AI instructions
  const [aiDecideForTitle, setAiDecideForTitle] = useState(true);
  
  // Mock data from user profile
  const businessName = "gil.arbisman";
  const subCategory = "יעוץ עסקי";
  const logoUrl = "/hoogi-new-avatar.png";

  const handleChannelToggle = (channel: string) => {
    setSelectedChannels(prev => 
      prev.includes(channel) 
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  const handleShowDemo = (channel: string) => {
    setSelectedChannelForDemo(channel);
    setShowDemoModal(true);
  };

  // Load template for editing
  const loadTemplateForEdit = (template: any) => {
    console.log("Loading template for edit:", template);
    
    setTemplateName(template.name || "");
    setTemplateType(template.type || "standard");
    setResponseType(template.responseType || "new_customer");
    setSelectedChannels(template.channels || []);
    setEmailSubject(template.subject || "");
    setMessageBody(template.body || "");
    setCustomAiMessage(template.aiInstructions || "");
    
    if (template.aiPosition) {
      setAiPosition(template.aiPosition);
    }
    
    if (template.reminderDelay) {
      setReminderDelay(template.reminderDelay);
    }
    
    if (template.reminderTime) {
      setReminderTime(template.reminderTime);
    }
    
    if (template.reminderDays) {
      setReminderDays(template.reminderDays);
    }
    
    if (template.leadStatus) {
      setLeadStatus(template.leadStatus);
    }
    
    if (template.leadSubStatus) {
      setLeadSubStatus(template.leadSubStatus);
    }
    
    if (template.design) {
      setTemplateDesign(template.design);
    }
    
    setEditingTemplateId(template.id);
    setIsEditMode(true);
    setActiveTab("templates");
    
    toast.success("תבנית נטענה לעריכה", {
      description: `תבנית "${template.name}" מוכנה לעריכה`
    });
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast.error("נא להזין שם לתבנית");
      return;
    }

    // בדיקת שדות חובה לתזכורת
    if (responseType === "reminder" && !leadStatus) {
      toast.error("נא לבחור סטטוס ליד לתזכורת");
      return;
    }

    if (templateType !== "standard" && !emailSubject.trim()) {
      toast.error("נא להזין כותרת למייל");
      return;
    }

    if (templateType !== "standard" && !messageBody.trim()) {
      toast.error("נא להזין גוף הודעה");
      return;
    }

    if (templateType === "ai" && selectedChannels.length === 0) {
      toast.error("נא לבחור לפחות ערוץ אחד");
      return;
    }

    if (templateType !== "ai" && templateType !== "standard" && !singleChannel) {
      toast.error("נא לבחור ערוץ שליחה");
      return;
    }

    // Save template logic here
    toast.success("התבנית נשמרה בהצלחה!");
    navigate("/automations");
  };

  const createExampleTemplate = () => {
    setTemplateName("תבנית דוגמה");
    setEmailSubject("תודה על מילוי השאלון - {{businessName}}");
    setMessageBody("שלום {{firstName}},\n\nתודה שמילאת את השאלון שלנו.\nפנייתך התקבלה ואנו נחזור אליך בהקדם.\n\nבברכה,\n{{businessName}}");
    setCustomAiMessage("הודעה מותאמת אישית שתופיע לפני תגובת ה-AI");
    setTemplateDesign(prev => ({
      ...prev,
      linkUrl: "https://example.com",
      primaryColor: "#10B981",
      secondaryColor: "#F59E0B"
    }));
    toast.success("נוצרה דוגמה לתבנית!");
  };

  return (
    <MainLayout initialState="content">
      <div className="flex flex-col w-full min-h-screen bg-background p-4 md:p-8" dir="rtl">
        {/* Back Button */}
        <div className="flex items-center mb-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.history.back()}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowRight className="ml-2 h-4 w-4" />
            חזור
          </Button>
        </div>

        {/* Header with business name */}
        <div className="mb-6">
          <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
            <div className="text-center">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">
                {businessName} - {subCategory}
              </h1>
            </div>
          </div>
        </div>


        <div className="max-w-4xl mx-auto w-full">
          {/* Tabs */}
          <Tabs 
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "templates" | "notifications" | "my-templates")}
            className="w-full mb-6"
          >
            <TabsList className="grid grid-cols-3 gap-1 md:gap-2 mb-4 md:mb-6 w-full">
              <TabsTrigger 
                value="notifications" 
                className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm text-right px-2 md:px-4 py-2 md:py-3"
              >
                <Bell className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">ההתראות שלי</span>
                <span className="sm:hidden">התראות</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="my-templates" 
                className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm text-right px-2 md:px-4 py-2 md:py-3"
              >
                <FileText className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">התבניות שלי</span>
                <span className="sm:hidden">תבניות</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="templates" 
                className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm text-right px-2 md:px-4 py-2 md:py-3"
              >
                <span className="hidden sm:inline">יצירת תבנית למענה לקוח</span>
                <span className="sm:hidden">יצירת תבנית</span>
                <Edit className="h-3 w-3 md:h-4 md:w-4" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="mt-2">
              {/* Edit Mode Indicator */}
              {isEditMode && (
                <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-4 md:p-6 shadow-sm border border-green-200 mb-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-base md:text-lg font-semibold text-foreground mb-2 text-right">
                        עריכת תבנית
                      </h3>
                      <p className="text-sm text-gray-600 text-right">
                        אתה עורך תבנית קיימת. ניתן לשנות את כל השדות ולשמור את השינויים.
                      </p>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setIsEditMode(false);
                        setEditingTemplateId(null);
                        setTemplateName("");
                        setTemplateType("standard");
                        setResponseType("new_customer");
                        setSelectedChannels([]);
                        setEmailSubject("");
                        setEmailBody("");
                        setMessageBody("");
                        setCustomAiMessage("");
                        toast.info("מצב עריכה בוטל - ניתן ליצור תבנית חדשה");
                      }}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      צור תבנית חדשה
                    </Button>
                  </div>
                </div>
              )}

              {/* Main form section */}
              <div className="space-y-4 md:space-y-6 mb-6">

              {/* פרטים בסיסיים */}
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 md:p-6 shadow-sm border border-primary/20 hover:shadow-md transition-shadow">
                <h3 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4 text-right">פרטים בסיסיים</h3>
              
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="template-name" className="text-sm font-medium mb-2 block text-right">שם התבנית</Label>
                    <Input
                      id="template-name"
                      placeholder="הקלד שם לתבנית..."
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="text-base text-right"
                    />
                  </div>

                  <div>
                    <Label htmlFor="template-type" className="text-sm font-medium mb-2 block text-right">סוג התבנית</Label>
                    <Select value={templateType} onValueChange={(value: any) => setTemplateType(value)}>
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder="בחר סוג תבנית" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">
                          <div className="flex items-center justify-end gap-2">
                            <span>סטנדרט</span>
                            <Star className="h-4 w-4 text-gray-500" />
                          </div>
                        </SelectItem>
                        <SelectItem value="ai">
                          <div className="flex items-center justify-end gap-2">
                            <span>AI</span>
                            <Wand2 className="h-4 w-4 text-blue-500" />
                          </div>
                        </SelectItem>
                        <SelectItem value="personal">
                          <div className="flex items-center justify-end gap-2">
                            <span>משוב אישי</span>
                            <Users className="h-4 w-4 text-green-500" />
                          </div>
                        </SelectItem>
                        <SelectItem value="combined">
                          <div className="flex items-center justify-end gap-2">
                            <span>AI משולב אישי</span>
                            <Sparkles className="h-4 w-4 text-purple-500" />
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                      אפשרות תזכורת תלויה בסוג המנוי - לפיתוח עתידי
                    </p>
                  </div>

                  {/* בחירת סוג המענה - תמיד מוצג */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block text-right">סוג המענה <span className="text-red-500">*</span></Label>
                    <div className="flex gap-3">
                      <Button 
                        variant={responseType === "reminder" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setResponseType("reminder")}
                      >
                        תזכורת
                      </Button>
                      <Button 
                        variant={responseType === "new_customer" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setResponseType("new_customer")}
                      >
                        מענה ללקוח חדש
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* תבנית סטנדרטית - רק לסטנדרט */}
              {templateType === "standard" && (
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 md:p-6 shadow-sm border border-primary/20 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold text-right">תבנית סטנדרטית</h3>
                      <Star className="h-5 w-5 text-primary" />
                    </div>
                    <div className="bg-primary text-primary-foreground px-3 py-1 rounded-lg text-sm font-medium">
                      תבנית סטנדרט
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-right">כותרת ההודעה</Label>
                        <Input 
                          value="קיבלנו את השאלון שלך - {{businessName}}"
                          className="text-right bg-gray-50"
                          readOnly
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-right">ערוץ שליחה</Label>
                        <div className="flex gap-2">
                          <Button variant="default" size="sm" className="flex-1">מייל</Button>
                          <Button variant="outline" size="sm" className="flex-1 opacity-50 cursor-not-allowed">וואטסאפ</Button>
                        </div>
                      </div>
                    </div>
                  
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-right">תוכן ההודעה (עד 2 שורות)</Label>
                      <Textarea 
                        value="שלום {{firstName}},\nתודה שמילאת את השאלון שלנו. פנייתך התקבלה ואנו נחזור אליך בהקדם."
                        className="min-h-[60px] max-h-[60px] resize-none text-right bg-gray-50"
                        rows={2}
                        readOnly
                      />
                      <p className="text-xs text-muted-foreground text-right">מוגבל ל-2 שורות בלבד</p>
                    </div>
                  
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 ml-2" />
                        ערוך תשובה
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* הגדרות תזכורת - רק לתזכורת */}
              {responseType === "reminder" && (
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 md:p-6 shadow-sm border border-orange-200 hover:shadow-md transition-shadow">
                  <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-foreground text-right">הגדרות תזכורת</h3>
                  
                  <div className="space-y-4">
                    {/* סטטוס ותת סטטוס באותה שורה */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="lead-status" className="text-sm font-medium mb-2 block text-right">סטטוס ליד <span className="text-red-500">*</span></Label>
                        <Select value={leadStatus} onValueChange={setLeadStatus}>
                          <SelectTrigger className="text-right">
                            <SelectValue placeholder="בחר סטטוס ליד" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">חדש</SelectItem>
                            <SelectItem value="contacted">יצר קשר</SelectItem>
                            <SelectItem value="qualified">מוסמך</SelectItem>
                            <SelectItem value="proposal">הצעה</SelectItem>
                            <SelectItem value="negotiation">משא ומתן</SelectItem>
                            <SelectItem value="closed-won">סגור - זכייה</SelectItem>
                            <SelectItem value="closed-lost">סגור - הפסד</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="lead-sub-status" className="text-sm font-medium mb-2 block text-right">תת סטטוס ליד</Label>
                        <Select value={leadSubStatus} onValueChange={setLeadSubStatus}>
                          <SelectTrigger className="text-right">
                            <SelectValue placeholder="בחר תת סטטוס" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hot">חם</SelectItem>
                            <SelectItem value="warm">פושר</SelectItem>
                            <SelectItem value="cold">קר</SelectItem>
                            <SelectItem value="not-interested">לא מעוניין</SelectItem>
                            <SelectItem value="callback">להתקשר שוב</SelectItem>
                            <SelectItem value="meeting-scheduled">פגישה נקבעה</SelectItem>
                            <SelectItem value="proposal-sent">הצעה נשלחה</SelectItem>
                            <SelectItem value="negotiating">במשא ומתן</SelectItem>
                            <SelectItem value="won">זכייה</SelectItem>
                            <SelectItem value="lost">הפסד</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* תזמון שליחה */}
                    <div>
                      <Label htmlFor="timing-type" className="text-sm font-medium mb-2 block text-right">תזמון שליחה לאחר שינוי סטטוס</Label>
                      <Select value={reminderDelay} onValueChange={setReminderDelay}>
                        <SelectTrigger className="text-right">
                          <SelectValue placeholder="בחר תזמון" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">מיידי (לאחר שעה)</SelectItem>
                          <SelectItem value="custom">תזמן זמן מותאם</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* מספר ימים ושעת שליחה - רק אם בחרו "תזמן זמן מותאם" */}
                    {reminderDelay === "custom" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="reminder-days" className="text-sm font-medium mb-2 block text-right">מספר ימים</Label>
                          <Input
                            id="reminder-days"
                            type="number"
                            placeholder="1"
                            value={reminderDays}
                            onChange={(e) => setReminderDays(parseInt(e.target.value) || 0)}
                            className="text-base text-right"
                          />
                        </div>
                        <div>
                          <Label htmlFor="reminder-time" className="text-sm font-medium mb-2 block text-right">שעת שליחה</Label>
                          <div className="relative">
                            <Input
                              id="reminder-time"
                              type="time"
                              value={reminderTime}
                              onChange={(e) => setReminderTime(e.target.value)}
                              className="text-base pr-10"
                            />
                            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}


              {/* תוכן ההודעה - לא סטנדרט ולא משולב */}
              {templateType !== "standard" && templateType !== "combined" && (
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 md:p-6 shadow-sm border border-green-200 hover:shadow-md transition-shadow">
                  <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-foreground text-right">תוכן ההודעה</h3>
                
                  <div className="space-y-4">
                    {/* כותרת - תמיד מוצג למייל */}
                    {(singleChannel === "email" || selectedChannels.includes("email")) && templateType === "ai" && (
                      <div>
                        <div className="flex items-center justify-end gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 text-right">תן ל-i hoogi להחליט בשבילך</span>
                            <Checkbox 
                              checked={aiDecideForTitle} 
                              onCheckedChange={setAiDecideForTitle}
                              className="w-4 h-4"
                            />
                          </div>
                        </div>
                        {!aiDecideForTitle && (
                          <Input
                            id="email-subject"
                            placeholder="הקלד כותרת..."
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            className="text-base text-right"
                          />
                        )}
                      </div>
                    )}
                    

                    {/* הנחיות AI - רק ל-AI */}
                    {templateType === "ai" && (
                      <div>
                        <Label htmlFor="ai-instructions" className="text-sm font-medium mb-2 block text-right">הנחיות AI</Label>
                        {!aiDecideForTitle && (
                          <Textarea
                            id="ai-instructions"
                            placeholder="תן הנחיות ל-AI איך לכתוב את ההודעה...\n\nלדוגמה:\n- כתוב בצורה חמה ומזמינה\n- הדגש את היתרונות שלנו\n- סיים בקריאה לפעולה"
                            value={customAiMessage}
                            onChange={(e) => setCustomAiMessage(e.target.value)}
                            className="min-h-[120px] text-base resize-none text-right"
                          />
                        )}
                      </div>
                    )}

                    {/* כותרת וגוף ההודעה - רק ל-personal (לא AI) */}
                    {templateType === "personal" && (
                      <>
                        <div>
                          <Label htmlFor="personal-subject" className="text-sm font-medium mb-2 block text-right">כותרת</Label>
                          <Input
                            id="personal-subject"
                            placeholder="הקלד כותרת..."
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            className="text-base text-right"
                          />
                        </div>
                        <div>
                          <Label htmlFor="message-body" className="text-sm font-medium mb-2 block text-right">גוף ההודעה</Label>
                          <Textarea
                            id="message-body"
                            placeholder="הקלד את תוכן ההודעה...\n\nניתן להשתמש במשתנים:\n{{firstName}} - שם פרטי\n{{lastName}} - שם משפחה\n{{businessName}} - שם העסק\n{{date}} - תאריך"
                            value={messageBody}
                            onChange={(e) => setMessageBody(e.target.value)}
                            className="min-h-[120px] text-base resize-none text-right"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}


              {/* הגדרות AI משולב - רק למשולב */}
              {templateType === "combined" && (
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 md:p-6 shadow-sm border border-indigo-200 hover:shadow-md transition-shadow">
                  <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-foreground text-right">הגדרות AI משולב</h3>
                
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-end gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 text-right">תן ל-i hoogi להחליט בשבילך</span>
                          <Checkbox 
                            checked={aiDecideForCombined} 
                            onCheckedChange={setAiDecideForCombined}
                            className="w-4 h-4"
                          />
                        </div>
                      </div>
                      {!aiDecideForCombined && (
                        <Input
                          id="email-subject-combined"
                          placeholder="הקלד כותרת..."
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          className="text-base text-right"
                        />
                      )}
                    </div>

                    <div>
                      <Label htmlFor="ai-position" className="text-sm font-medium mb-2 block text-right">מיקום תגובת AI</Label>
                      <Select value={aiPosition} onValueChange={(value: any) => setAiPosition(value)}>
                        <SelectTrigger className="text-right">
                          <SelectValue placeholder="בחר מיקום" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="start">בתחילת התשובה</SelectItem>
                          <SelectItem value="middle">באמצע התשובה</SelectItem>
                          <SelectItem value="end">בסוף התשובה</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="ai-instructions-combined" className="text-sm font-medium mb-2 block text-right">הוראות ל-AI</Label>
                      {!aiDecideForCombined && (
                        <Textarea
                          id="ai-instructions-combined"
                          placeholder="תן הנחיות ל-AI איך לכתוב את החלק שלו בהודעה...\n\nלדוגמה:\n- כתוב בצורה חמה ומזמינה\n- הדגש את היתרונות שלנו\n- סיים בקריאה לפעולה"
                          value={customAiMessage}
                          onChange={(e) => setCustomAiMessage(e.target.value)}
                          className="min-h-[100px] text-base resize-none text-right"
                        />
                      )}
                    </div>

                    <div>
                      <Label htmlFor="personal-text-combined" className="text-sm font-medium mb-2 block text-right">התוספת מלל אישי</Label>
                      <Textarea
                        id="personal-text-combined"
                        placeholder="הקלד את החלק האישי שלך בהודעה...\n\nניתן להשתמש במשתנים:\n{{firstName}} - שם פרטי\n{{lastName}} - שם משפחה\n{{businessName}} - שם העסק\n{{date}} - תאריך"
                        value={messageBody}
                        onChange={(e) => setMessageBody(e.target.value)}
                        className="min-h-[100px] text-base resize-none text-right"
                      />
                    </div>
                  </div>
                </div>
              )}

              </div>

              {/* Logo, Profile and Brand Colors section */}
              <div className="mb-6">
                <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
                  <h3 className="text-base md:text-lg font-semibold mb-4 text-foreground text-right">עיצוב התבנית</h3>
                
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Logo section */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground text-right">הוספת לוגו לתבנית</span>
                        <Checkbox 
                          checked={includeLogo} 
                          onCheckedChange={setIncludeLogo}
                          className="w-5 h-5"
                        />
                      </div>
                      <img
                        src={logoUrl}
                        alt="Logo"
                        className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover border-2 border-primary/20"
                      />
                    </div>

                    {/* Profile Picture section */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground text-right">הוספת תמונת פרופיל</span>
                        <Checkbox 
                          checked={includeProfile} 
                          onCheckedChange={setIncludeProfile}
                          className="w-5 h-5"
                        />
                      </div>
                      <img
                        src={profileFile || logoUrl}
                        alt="Profile"
                        className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover border-2 border-primary/20"
                      />
                    </div>

                    {/* Brand Colors section */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground text-right">הוספת צבעי מותג</span>
                        <Palette className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex gap-2">
                        <div 
                          className="w-8 h-8 rounded-full border-2 border-gray-300"
                          style={{ backgroundColor: templateDesign.primaryColor }}
                          title="צבע ראשי"
                        />
                        <div 
                          className="w-8 h-8 rounded-full border-2 border-gray-300"
                          style={{ backgroundColor: templateDesign.secondaryColor }}
                          title="צבע משני"
                        />
                        <div 
                          className="w-8 h-8 rounded-full border-2 border-gray-300"
                          style={{ backgroundColor: templateDesign.backgroundColor }}
                          title="צבע רקע"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* הוספת קישור / תמונה - לא סטנדרט */}
              {templateType !== "standard" && (
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 md:p-6 shadow-sm border border-purple-200 hover:shadow-md transition-shadow">
                  <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-foreground text-right">הוספת קישור / תמונה</h3>
                
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="link-url" className="text-sm font-medium mb-2 block text-right">קישור</Label>
                      <Input
                        id="link-url"
                        placeholder="https://example.com"
                        value={templateDesign.linkUrl}
                        onChange={(e) => setTemplateDesign(prev => ({ ...prev, linkUrl: e.target.value }))}
                        className="text-base text-right"
                      />
                    </div>

                    <div>
                      <Label htmlFor="document-file" className="text-sm font-medium mb-2 block text-right">העלאת קובץ</Label>
                      <Input
                        id="document-file"
                        type="file"
                        accept="image/*,.pdf,.doc,.docx"
                        className="cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setDocumentFile(file.name);
                            setTemplateDesign(prev => ({ ...prev, documentUrl: file.name }));
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* התאמת התבנית לערוצים + דוגמא */}
              <div className="mb-6">
                {/* התאמת התבנית לערוצים */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 md:p-6 shadow-sm border border-blue-200 hover:shadow-md transition-shadow mb-6">
                  <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-foreground text-right">התאמת התבנית לערוצים</h3>
                
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button 
                      variant={selectedChannels.includes("general") ? "default" : "outline"}
                      className={`${selectedChannels.includes("general") ? "bg-gray-600 hover:bg-gray-700 border-gray-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                      onClick={() => handleChannelToggle("general")}
                    >
                      <FileText className="h-4 w-4 ml-2" />
                      כללי
                    </Button>
                    
                    <Button 
                      variant={selectedChannels.includes("message") ? "default" : "outline"}
                      className={`${selectedChannels.includes("message") ? "bg-purple-600 hover:bg-purple-700 border-purple-600" : "border-purple-300 text-purple-700 hover:bg-purple-50"}`}
                      onClick={() => handleChannelToggle("message")}
                    >
                      <MessageCircle className="h-4 w-4 ml-2" />
                      הודעה
                    </Button>
                    
                    <Button 
                      variant={selectedChannels.includes("whatsapp") ? "default" : "outline"}
                      className={`${selectedChannels.includes("whatsapp") ? "bg-green-600 hover:bg-green-700 border-green-600" : "border-green-300 text-green-700 hover:bg-green-50"}`}
                      onClick={() => handleChannelToggle("whatsapp")}
                    >
                      <MessageCircle className="h-4 w-4 ml-2" />
                      וואטסאפ
                    </Button>
                    
                    <Button 
                      variant={selectedChannels.includes("email") ? "default" : "outline"}
                      className={`${selectedChannels.includes("email") ? "bg-blue-600 hover:bg-blue-700 border-blue-600" : "border-blue-300 text-blue-700 hover:bg-blue-50"}`}
                      onClick={() => handleChannelToggle("email")}
                    >
                      <Mail className="h-4 w-4 ml-2" />
                      מייל
                    </Button>
                  </div>
                </div>

                {/* דוגמא למענה לפי הערוצים שנבחרו */}
                {selectedChannels.length > 0 && (
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 md:p-6 shadow-sm border border-purple-200 hover:shadow-md transition-shadow">
                    <h3 className="text-base md:text-lg font-semibold mb-4 text-foreground text-right">דוגמא למענה לפי הערוצים שנבחרו</h3>
                
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedChannels.map((channel) => (
                        <div key={channel} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-sm font-semibold">
                              {channel === "general" && "כללי"}
                              {channel === "message" && "הודעה"}
                              {channel === "whatsapp" && "וואטסאפ"}
                              {channel === "email" && "מייל"}
                            </span>
                            {channel === "general" && <FileText className="h-5 w-5 text-gray-600" />}
                            {channel === "message" && <MessageCircle className="h-5 w-5 text-purple-600" />}
                            {channel === "whatsapp" && <MessageCircle className="h-5 w-5 text-green-600" />}
                            {channel === "email" && <Mail className="h-5 w-5 text-blue-600" />}
                          </div>
                          
                          <div className="text-xs text-gray-500 mb-3 text-right">
                            {templateType === "standard" && "תבנית סטנדרטית"}
                            {templateType === "ai" && "תבנית AI"}
                            {templateType === "personal" && "משוב אישי"}
                            {templateType === "combined" && "AI משולב אישי"}
                          </div>
                          
                          {/* Preview content based on template type */}
                          <div className="text-sm text-gray-700 mb-3 text-right">
                            {templateType === "standard" && (
                              <div>
                                <div className="font-medium mb-1">תודה על מילוי השאלון!</div>
                                <div className="text-gray-500">התשובות שלך התקבלו בהצלחה</div>
                              </div>
                            )}
                            {templateType === "ai" && (
                              <div>
                                <div className="font-medium mb-1">תגובת AI מותאמת אישית</div>
                                <div className="text-gray-500">על בסיס התשובות שלך</div>
                              </div>
                            )}
                            {templateType === "personal" && (
                              <div>
                                <div className="font-medium mb-1">משוב אישי</div>
                                <div className="text-gray-500">הודעה מותאמת אישית</div>
                              </div>
                            )}
                            {templateType === "combined" && (
                              <div>
                                <div className="font-medium mb-1">AI + משוב אישי</div>
                                <div className="text-gray-500">שילוב של בינה מלאכותית ומשוב אישי</div>
                              </div>
                            )}
                          </div>
                          
                          {/* Show demo button */}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleShowDemo(channel)}
                            className="w-full flex items-center justify-center gap-2 text-xs"
                          >
                            הצג דוגמא
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>


              {/* Save/Cancel buttons - רק בלשונית התבניות */}
              <div className="mt-8 flex flex-col md:flex-row gap-3 md:gap-4 justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => navigate(-1)}
                  className="px-8 py-3 text-base font-medium"
                >
                  ביטול
                </Button>
                <Button 
                  onClick={() => {
                    toast.success("תבנית נשמרה בהצלחה!", {
                      description: `תבנית "${templateName}" נשמרה וזמינה לשימוש`
                    });
                  }}
                  className="px-8 py-3 text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
                >
                  {isEditMode ? "עדכן תבנית" : "שמור תבנית"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="my-templates" className="mt-2">
              {/* My Templates Content */}
              <MyTemplatesTab onEditTemplate={loadTemplateForEdit} />
            </TabsContent>

            <TabsContent value="notifications" className="mt-2">
              {/* Notifications content */}
              <div className="space-y-6">
                {/* Header */}
                <div className="text-right mb-8">
                  <div className="flex items-center justify-end gap-3 mb-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">ההתראות שלי</h1>
                    <Bell className="h-8 w-8 text-blue-500" />
                  </div>
                  <p className="text-gray-500 text-lg text-right">ניהול התראות והגדרות תזמון</p>
                </div>

                {/* Timing Settings */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 shadow-sm border border-blue-200 mb-6">
                  <div className="flex items-center justify-end gap-3 mb-6">
                    <h2 className="text-xl font-semibold text-right">הגדרות תזמון</h2>
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  
                  <div className="space-y-4 md:space-y-6">
                    {/* תדירות התראות */}
                    <div className="space-y-2">
                      <Label className="text-sm md:text-base font-medium text-right">תדירות התראות</Label>
                      <Select 
                        value={notificationTiming.frequency} 
                        onValueChange={(value) => setNotificationTiming(prev => ({ ...prev, frequency: value }))}
                      >
                        <SelectTrigger className="text-right text-sm md:text-base">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">יומי</SelectItem>
                          <SelectItem value="every3days">כל 3 ימים</SelectItem>
                          <SelectItem value="weekly">שבועי</SelectItem>
                          <SelectItem value="monthly">חודשי</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* כמה פעמים ביום - רק ליומי */}
                    {notificationTiming.frequency === "daily" && (
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-right">כמה פעמים ביום</Label>
                        <Select 
                          value={notificationTiming.dailyFrequency || "1"} 
                          onValueChange={(value) => setNotificationTiming(prev => ({ ...prev, dailyFrequency: value }))}
                        >
                          <SelectTrigger className="text-right">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">פעם אחת</SelectItem>
                            <SelectItem value="2">פעמיים</SelectItem>
                            <SelectItem value="3">3 פעמים</SelectItem>
                            <SelectItem value="4">4 פעמים</SelectItem>
                            <SelectItem value="6">6 פעמים</SelectItem>
                            <SelectItem value="8">8 פעמים</SelectItem>
                            <SelectItem value="12">12 פעמים</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* שעות שליחה */}
                    <div className="space-y-2">
                      <Label className="text-base font-medium text-right">
                        {notificationTiming.frequency === "daily" ? "שעות שליחה" : "שעת שליחה"}
                      </Label>
                      <div className="space-y-2">
                        {notificationTiming.frequency === "daily" ? (
                          // מספר שעות לפי כמה פעמים ביום - רק ליומי
                          Array.from({ length: parseInt(notificationTiming.dailyFrequency || "1") }, (_, i) => (
                            <Input 
                              key={i}
                              type="time"
                              placeholder={`שעה ${i + 1}`}
                              className="text-base p-3 text-right"
                            />
                          ))
                        ) : (
                          // שעה אחת לכל השאר (כל 3 ימים, שבועי, חודשי)
                          <Input 
                            type="time"
                            value={notificationTiming.time}
                            onChange={(e) => setNotificationTiming(prev => ({ ...prev, time: e.target.value }))}
                            className="text-base p-3 text-right"
                          />
                        )}
                      </div>
                    </div>
                    
                    {/* הפעל התראות */}
                    <div className="space-y-2">
                      <Label className="text-base font-medium text-right">הפעל התראות</Label>
                      <div className="flex items-center justify-end gap-3 p-3 bg-white rounded-lg border">
                        <Switch 
                          checked={notificationTiming.enabled}
                          onCheckedChange={(checked) => setNotificationTiming(prev => ({ ...prev, enabled: checked }))}
                          className="scale-110"
                        />
                        <span className="text-sm font-medium">
                          {notificationTiming.enabled ? "מופעל" : "מבוטל"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notification Channels */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 shadow-sm border border-blue-200 mb-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2 text-right">ערוצי התראה</h2>
                    <p className="text-gray-500 text-right">בחר איך לקבל התראות</p>
                  </div>
                  
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 bg-green-50 rounded-xl border border-green-200 gap-3">
                      <div className="flex items-center gap-2 md:gap-3">
                        <Mail className="h-4 w-4 md:h-5 md:w-5 text-green-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="text-sm md:text-base font-medium">התראות בדואר אלקטרוני</span>
                          <p className="text-xs text-green-600 mt-1">אין הגבלות על כמות ההתראות</p>
                        </div>
                      </div>
                      <Switch defaultChecked className="scale-110 flex-shrink-0" />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 bg-gray-50 rounded-xl border border-gray-200 gap-3">
                      <div className="flex items-center gap-2 md:gap-3">
                        <MessageCircle className="h-4 w-4 md:h-5 md:w-5 text-gray-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="text-sm md:text-base font-medium">התראות בוואטסאפ</span>
                          <p className="text-xs text-orange-600 mt-1">⚠️ מוגבל - יסגר אוטומטית בסיום מכסת ההתראות</p>
                        </div>
                      </div>
                      <Switch className="scale-110 flex-shrink-0" />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 bg-purple-50 rounded-xl border border-purple-200 gap-3">
                      <div className="flex items-center gap-2 md:gap-3">
                        <MessageCircle className="h-4 w-4 md:h-5 md:w-5 text-purple-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="text-sm md:text-base font-medium">התראות בהודעה</span>
                          <p className="text-xs text-orange-600 mt-1">⚠️ מוגבל - יסגר אוטומטית בסיום מכסת ההתראות</p>
                        </div>
                      </div>
                      <Switch className="scale-110 flex-shrink-0" />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 shadow-sm border border-border mb-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2 text-right">פרטי התקשרות</h2>
                    <p className="text-gray-500 text-right">כתובות לקבלת התראות</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email-address" className="text-base font-medium">כתובת דואר אלקטרוני</Label>
                      <Input 
                        id="email-address"
                        type="email"
                        defaultValue="user@example.com"
                        placeholder="user@example.com"
                        className="text-base p-3 border-2 focus:border-blue-500"
                        dir="ltr"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp-number" className="text-base font-medium">מספר וואטסאפ</Label>
                      <Input 
                        id="whatsapp-number"
                        type="tel"
                        defaultValue="+972501234567"
                        placeholder="+972501234567"
                        className="text-base p-3 border-2 focus:border-green-500"
                        dir="ltr"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message-number" className="text-base font-medium">מספר להודעה</Label>
                      <Input 
                        id="message-number"
                        type="tel"
                        defaultValue="+972501234567"
                        placeholder="+972501234567"
                        className="text-base p-3 border-2 focus:border-purple-500"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-center">
                  <Button 
                    onClick={() => {
                      toast.success("התרעות נשמרו", {
                        description: `תזמון: ${notificationTiming.frequency} בשעה ${notificationTiming.time}`
                      });
                    }}
                    className="px-12 py-3 text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                  >
                    <Bell className="ml-2 h-5 w-5" />
                    שמירת הגדרות התראות
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Demo Modal */}
      <Dialog open={showDemoModal} onOpenChange={setShowDemoModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right">
              דמו - {selectedChannelForDemo === "general" && "כללי"}
              {selectedChannelForDemo === "message" && "הודעה"}
              {selectedChannelForDemo === "whatsapp" && "וואטסאפ"}
              {selectedChannelForDemo === "email" && "מייל"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Channel header */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {selectedChannelForDemo === "general" && <FileText className="h-5 w-5 text-gray-600" />}
              {selectedChannelForDemo === "message" && <MessageCircle className="h-5 w-5 text-purple-600" />}
              {selectedChannelForDemo === "whatsapp" && <MessageCircle className="h-5 w-5 text-green-600" />}
              {selectedChannelForDemo === "email" && <Mail className="h-5 w-5 text-blue-600" />}
              <span className="font-medium">
                {selectedChannelForDemo === "general" && "כללי"}
                {selectedChannelForDemo === "message" && "הודעה"}
                {selectedChannelForDemo === "whatsapp" && "וואטסאפ"}
                {selectedChannelForDemo === "email" && "מייל"}
              </span>
            </div>

            {/* Template type */}
            <div className="text-sm text-gray-500">
              {templateType === "standard" && "תבנית סטנדרטית"}
              {templateType === "ai" && "תבנית AI"}
              {templateType === "personal" && "משוב אישי"}
              {templateType === "combined" && "AI משולב אישי"}
            </div>

            {/* Demo content based on template type */}
            <div className="border rounded-lg p-4 bg-white">
              {templateType === "standard" && (
                <div className="space-y-3">
                  <div className="font-medium text-lg">תודה על מילוי השאלון!</div>
                  <div className="text-gray-600">התשובות שלך התקבלו בהצלחה ונבדקות על ידי הצוות שלנו.</div>
                  <div className="text-gray-600">נחזור אליך בהקדם האפשרי.</div>
                </div>
              )}
              
              {templateType === "ai" && (
                <div className="space-y-3">
                  {emailSubject && <div className="font-medium text-lg">{emailSubject}</div>}
                  <div className="text-gray-600">תגובת AI מותאמת אישית על בסיס התשובות שלך:</div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm text-blue-800">
                      "תבסס על התשובות שלך, אני רואה שיש לך עניין בתחום... 
                      אני ממליץ לך להתמקד ב... וניתן לך מידע נוסף על..."
                    </div>
                  </div>
                </div>
              )}
              
              {templateType === "personal" && (
                <div className="space-y-3">
                  {emailSubject && <div className="font-medium text-lg">{emailSubject}</div>}
                  <div className="text-gray-600">משוב אישי מותאם:</div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-sm text-green-800">
                      {messageBody || "הודעה אישית מותאמת לפי התשובות שלך..."}
                    </div>
                  </div>
                </div>
              )}
              
              {templateType === "combined" && (
                <div className="space-y-3">
                  {emailSubject && <div className="font-medium text-lg">{emailSubject}</div>}
                  <div className="text-gray-600">שילוב של AI ומשוב אישי:</div>
                  
                  {aiPosition === "start" && (
                    <div className="space-y-3">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-sm text-blue-800 font-medium">חלק AI:</div>
                        <div className="text-sm text-blue-700">
                          {customAiMessage || "תגובת AI מותאמת אישית..."}
                        </div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-sm text-green-800 font-medium">חלק אישי:</div>
                        <div className="text-sm text-green-700">
                          {messageBody || "הודעה אישית..."}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {aiPosition === "middle" && (
                    <div className="space-y-3">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-sm text-green-800 font-medium">חלק אישי:</div>
                        <div className="text-sm text-green-700">
                          {messageBody || "הודעה אישית..."}
                        </div>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-sm text-blue-800 font-medium">חלק AI:</div>
                        <div className="text-sm text-blue-700">
                          {customAiMessage || "תגובת AI מותאמת אישית..."}
                        </div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-sm text-green-800 font-medium">חלק אישי:</div>
                        <div className="text-sm text-green-700">
                          {messageBody || "הודעה אישית..."}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {aiPosition === "end" && (
                    <div className="space-y-3">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-sm text-green-800 font-medium">חלק אישי:</div>
                        <div className="text-sm text-green-700">
                          {messageBody || "הודעה אישית..."}
                        </div>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-sm text-blue-800 font-medium">חלק AI:</div>
                        <div className="text-sm text-blue-700">
                          {customAiMessage || "תגובת AI מותאמת אישית..."}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Channel-specific formatting */}
            {selectedChannelForDemo === "email" && (
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                📧 פורמט מייל - כולל כותרת, תוכן מובנה ותחתית
              </div>
            )}
            
            {selectedChannelForDemo === "whatsapp" && (
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                💬 פורמט וואטסאפ - הודעה קצרה וידידותית
              </div>
            )}
            
            {selectedChannelForDemo === "message" && (
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                📱 פורמט הודעה - תצוגה מותאמת למכשיר נייד
              </div>
            )}
            
            {selectedChannelForDemo === "general" && (
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                📄 פורמט כללי - תצוגה אוניברסלית
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </MainLayout>
  );
};

// My Templates Tab Component
interface MyTemplatesTabProps {
  onEditTemplate: (template: any) => void;
}

const MyTemplatesTab: React.FC<MyTemplatesTabProps> = ({ onEditTemplate }) => {
  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: "תבנית מענה סטנדרטית",
      type: "standard",
      channels: ["email"],
      status: "active",
      createdAt: "2024-01-15",
      lastUsed: "2024-01-20",
      usageCount: 45,
      notes: "תבנית בסיסית למענה ללקוחות"
    },
    {
      id: 2,
      name: "מענה AI מותאם",
      type: "ai",
      channels: ["email", "whatsapp"],
      status: "active",
      createdAt: "2024-01-10",
      lastUsed: "2024-01-22",
      usageCount: 23,
      notes: "מענה אוטומטי עם בינה מלאכותית"
    },
    {
      id: 3,
      name: "תבנית תזכורת שבועית",
      type: "reminder",
      channels: ["whatsapp", "message"],
      status: "inactive",
      createdAt: "2024-01-05",
      lastUsed: "2024-01-18",
      usageCount: 12,
      notes: "תזכורת אוטומטית ללקוחות"
    },
    {
      id: 4,
      name: "מענה משולב אישי",
      type: "combined",
      channels: ["email", "whatsapp", "message"],
      status: "active",
      createdAt: "2024-01-12",
      lastUsed: "2024-01-21",
      usageCount: 67,
      notes: "שילוב של AI ומענה אישי"
    }
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [notes, setNotes] = useState("");

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "standard": return "סטנדרט";
      case "ai": return "AI";
      case "personal": return "משוב אישי";
      case "combined": return "AI משולב";
      case "reminder": return "תזכורת";
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "standard": return "bg-gray-100 text-gray-800 border-gray-200";
      case "ai": return "bg-blue-100 text-blue-800 border-blue-200";
      case "personal": return "bg-green-100 text-green-800 border-green-200";
      case "combined": return "bg-purple-100 text-purple-800 border-purple-200";
      case "reminder": return "bg-orange-100 text-orange-800 border-orange-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email": return <Mail className="h-3 w-3 text-green-600" />;
      case "whatsapp": return <MessageCircle className="h-3 w-3 text-green-600" />;
      case "message": return <MessageSquare className="h-3 w-3 text-blue-600" />;
      default: return <FileText className="h-3 w-3 text-gray-600" />;
    }
  };

  const handleEdit = (template: any) => {
    onEditTemplate(template);
  };

  const handleDelete = (templateId: number) => {
    if (confirm("האם אתה בטוח שברצונך למחוק תבנית זו?")) {
      setTemplates(templates.filter(t => t.id !== templateId));
      toast.success("התבנית נמחקה בהצלחה");
    }
  };

  const handleDuplicate = (template: any) => {
    const newTemplate = {
      ...template,
      id: Date.now(),
      name: `${template.name} (עותק)`,
      createdAt: new Date().toISOString().split('T')[0],
      usageCount: 0
    };
    setTemplates([...templates, newTemplate]);
    toast.success("התבנית הוכפלה בהצלחה");
  };

  const handleShowNotes = (template: any) => {
    setSelectedTemplate(template);
    setNotes(template.notes);
    setShowNotesDialog(true);
  };

  const handleSaveNotes = () => {
    if (selectedTemplate) {
      setTemplates(templates.map(t => 
        t.id === selectedTemplate.id ? { ...t, notes } : t
      ));
      setShowNotesDialog(false);
      toast.success("ההערות נשמרו בהצלחה");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-right mb-8">
        <div className="flex items-center justify-end gap-3 mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">התבניות שלי</h1>
          <FileText className="h-8 w-8 text-blue-500" />
        </div>
        <p className="text-gray-500 text-lg text-right">ניהול תבניות המענה שלך</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{templates.length}</div>
          <div className="text-sm text-gray-600">סך התבניות</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">
            {templates.filter(t => t.status === 'active').length}
          </div>
          <div className="text-sm text-gray-600">פעילות</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">
            {templates.reduce((sum, t) => sum + t.usageCount, 0)}
          </div>
          <div className="text-sm text-gray-600">סך שימושים</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-600">
            {Math.round(templates.reduce((sum, t) => sum + t.usageCount, 0) / templates.length) || 0}
          </div>
          <div className="text-sm text-gray-600">ממוצע שימושים</div>
        </div>
      </div>

      {/* Templates List */}
      <div className="space-y-4">
        {templates.map((template) => (
          <div key={template.id} className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              {/* Template Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-right">{template.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs border ${getTypeColor(template.type)}`}>
                    {getTypeLabel(template.type)}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    template.status === 'active' 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-gray-100 text-gray-800 border border-gray-200'
                  }`}>
                    {template.status === 'active' ? 'פעיל' : 'לא פעיל'}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    {template.channels.map((channel, index) => (
                      <div key={index} className="flex items-center gap-1">
                        {getChannelIcon(channel)}
                        <span>{channel}</span>
                        {index < template.channels.length - 1 && <span>,</span>}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                  <div>
                    <span className="font-medium">נוצר:</span> {template.createdAt}
                  </div>
                  <div>
                    <span className="font-medium">שימוש אחרון:</span> {template.lastUsed}
                  </div>
                  <div>
                    <span className="font-medium">סך שימושים:</span> {template.usageCount}
                  </div>
                  <div>
                    <span className="font-medium">הערות:</span> {template.notes ? '✓' : 'אין'}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEdit(template)}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  ערוך
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDuplicate(template)}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  הכפל
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleShowNotes(template)}
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  הערות
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDelete(template.id)}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  מחק
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Notes Dialog */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-right">
              הערות לתבנית: {selectedTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-right">הערות</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="הוסף הערות לתבנית..."
                className="text-right min-h-[120px]"
              />
            </div>
            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={() => setShowNotesDialog(false)}>
                ביטול
              </Button>
              <Button onClick={handleSaveNotes}>
                שמור הערות
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateTemplate;
