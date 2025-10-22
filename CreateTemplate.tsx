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
import CustomerResponseTab from "@/components/automations/CustomerResponseTab";

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
  const [activeTab, setActiveTab] = useState<"notifications" | "my-templates" | "customer-response">("customer-response");
  
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
            onValueChange={(value) => setActiveTab(value as "notifications" | "my-templates" | "customer-response")}
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
                value="customer-response" 
                className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm text-right px-2 md:px-4 py-2 md:py-3"
              >
                <MessageCircle className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">מענה לקוח</span>
                <span className="sm:hidden">מענה</span>
              </TabsTrigger>
            </TabsList>

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

            <TabsContent value="my-templates" className="mt-2">
              {/* My Templates Content */}
              <MyTemplatesTab onEditTemplate={loadTemplateForEdit} />
            </TabsContent>
            
            <TabsContent value="customer-response" className="mt-2">
              <CustomerResponseTab />
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
      sentCount: 12,
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
      sentCount: 8,
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
      sentCount: 5,
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
      sentCount: 25,
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

      {/* Stats - רק כמות נשלחו */}
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
            {templates.reduce((sum, t) => sum + (t.sentCount || 0), 0)}
          </div>
          <div className="text-sm text-gray-600">סך נשלחו</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-600">
            {Math.round(templates.reduce((sum, t) => sum + (t.sentCount || 0), 0) / templates.length) || 0}
          </div>
          <div className="text-sm text-gray-600">ממוצע נשלחו</div>
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
