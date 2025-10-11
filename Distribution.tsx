import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import SurveyPicker from "@/components/surveys/SurveyPicker";
import QuickLinks from "@/components/surveys/QuickLinks";
import PreviewPane from "@/components/surveys/PreviewPane";
import { Button } from "@/components/ui/button";
import { Plus, Mail, MessageCircle, Smartphone, ExternalLink, ArrowRight, Bell, Settings } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import TriggersTab from "@/components/automations/TriggersTab";
import PreferencesTab from "@/components/automations/PreferencesTab";
import automationTemplates from "@/lib/automationTemplates";
const Distribution = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "response");

  // Mock surveys data
  const surveys = [{
    id: "s-101",
    name: "שאלון שירותי ייעוץ עסקי"
  }, {
    id: "s-102",
    name: "שאלון שביעות רצון לקוחות"
  }, {
    id: "s-103",
    name: "שאלון אבחון צרכים"
  }];
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>("");
  const [currentMode, setCurrentMode] = useState<"form" | "chat" | "qr" | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>("");

  // Customer response settings
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [enableWhatsApp, setEnableWhatsApp] = useState(false);
  const [enableEmail, setEnableEmail] = useState(false);
  const [enableSMS, setEnableSMS] = useState(false);

  // Get templates for lead trigger (questionnaire submissions)
  const templates = automationTemplates.getAll().filter(t => t.triggerType === "lead");
  const handleBuildLink = (type: "form" | "chat" | "qr") => {
    if (!selectedSurveyId) {
      toast.error("בחר שאלון תחילה");
      return;
    }
    const base = typeof window !== "undefined" ? window.location.origin : "";
    let url = "";
    if (type === "form") {
      url = `${base}/form/${selectedSurveyId}`;
    } else if (type === "chat") {
      url = `${base}/chat/${selectedSurveyId}`;
    } else if (type === "qr") {
      url = `${base}/form/${selectedSurveyId}`;
    }
    setCurrentMode(type);
    setCurrentUrl(url);
    toast.success("קישור נוצר בהצלחה");
  };
  const handleCopyUrl = () => {
    if (currentUrl) {
      navigator.clipboard.writeText(currentUrl);
      toast.success("הקישור הועתק ללוח");
    }
  };
  const handlePreviewLink = (link: any) => {
    setCurrentMode(link.type);
    setCurrentUrl(link.url);
  };
  return <MainLayout initialState="content">
      <div className="flex flex-col w-full space-y-6 p-4 md:p-8 bg-background" dir="rtl">
        {/* Back Button */}
        <div className="flex items-center mb-2">
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

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="text-right">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2 justify-end">
              <span>📤</span> הפצת שאלונים
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1 text-right">
              צור קישורי הפצה לשאלונים שלך ושתף אותם עם הלקוחות
            </p>
          </div>
          
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 gap-2 mb-6" dir="rtl">
            <TabsTrigger value="triggers" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span>טריגר</span>
            </TabsTrigger>
            <TabsTrigger value="response" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span>מענה לקוחות</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>העדפות</span>
            </TabsTrigger>
          </TabsList>

          {/* Triggers Tab */}
          <TabsContent value="triggers">
            <TriggersTab />
          </TabsContent>

          {/* Response Tab */}
          <TabsContent value="response">
            <div className="bg-card rounded-2xl shadow-sm p-5 md:p-8 border border-border">
              {/* Survey Selection */}
              <div className="bg-muted/50 rounded-xl p-4 md:p-6 mb-6 border border-border">
                <SurveyPicker value={selectedSurveyId} onChange={setSelectedSurveyId} options={surveys} />
              </div>

              {/* Customer Response Section */}
              <div className="bg-card rounded-xl p-4 md:p-6 mb-6 border border-border">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground mb-4">ערוצי מענה אוטומטי ללקוח</h3>
            </div>

            {/* Template Selection */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <Label className="block text-sm font-semibold">בחר תבנית מענה ללקוח</Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate("/automations?tab=templates")} 
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 border-primary"
                >
                  <Plus className="h-4 w-4" />
                  צור תבנית חדשה
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="bg-background border-border" disabled={!selectedSurveyId}>
                  <SelectValue placeholder={selectedSurveyId ? "בחר תבנית מענה" : "יש לבחור שאלון תחילה"} />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50 border-border">
                  {templates.map(template => <SelectItem key={template.id} value={template.id}>
                      {template.name} - {template.channel === "email" ? "מייל" : template.channel === "whatsapp" ? "WhatsApp" : "SMS"}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Channel Selection */}
            <div className="space-y-3">
              <Label className="block text-sm font-semibold mb-2">ערוצי מענה אוטומטי ללקוח</Label>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col items-center p-3 rounded-lg bg-green-50 border border-green-200 hover:bg-green-100 transition-colors cursor-pointer">
                  <Checkbox id="whatsapp" checked={enableWhatsApp} onCheckedChange={checked => setEnableWhatsApp(checked as boolean)} disabled={!selectedSurveyId} className="mb-2" />
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mb-2">
                    <MessageCircle className="h-5 w-5 text-white" />
                  </div>
                  <Label htmlFor="whatsapp" className="text-center cursor-pointer">
                    <span className="font-medium text-green-800 text-sm">WhatsApp</span>
                  </Label>
                </div>

                <div className="flex flex-col items-center p-3 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer">
                  <Checkbox id="email" checked={enableEmail} onCheckedChange={checked => setEnableEmail(checked as boolean)} disabled={!selectedSurveyId} className="mb-2" />
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mb-2">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <Label htmlFor="email" className="text-center cursor-pointer">
                    <span className="font-medium text-blue-800 text-sm">מייל</span>
                  </Label>
                </div>

                <div className="flex flex-col items-center p-3 rounded-lg bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer">
                  <Checkbox id="sms" checked={enableSMS} onCheckedChange={checked => setEnableSMS(checked as boolean)} disabled={!selectedSurveyId} className="mb-2" />
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mb-2">
                    <Smartphone className="h-5 w-5 text-white" />
                  </div>
                  <Label htmlFor="sms" className="text-center cursor-pointer">
                    <span className="font-medium text-purple-800 text-sm">הודעת SMS</span>
                  </Label>
                </div>
              </div>
            </div>

            {!selectedSurveyId && <p className="mt-4 text-xs text-muted-foreground">יש לבחור שאלון כדי להפעיל מענה אוטומטי.</p>}

            {(enableWhatsApp || enableEmail || enableSMS) && selectedTemplate && selectedSurveyId && <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-foreground">
                  ✓ מענה אוטומטי יישלח ב-
                  {[enableWhatsApp && "WhatsApp", enableEmail && "מייל", enableSMS && "SMS"].filter(Boolean).join(", ")}
                </p>
              </div>}
          </div>

          {/* Quick Links Section */}
          <div className="mb-6">
            <QuickLinks currentUrl={currentUrl} onBuild={handleBuildLink} onCopy={handleCopyUrl} onPreview={handlePreviewLink} disabled={!selectedSurveyId} />
          </div>

              {/* Preview Section */}
              {currentMode && currentUrl && <div className="mt-6 md:mt-8 animate-fade-in">
                  <PreviewPane mode={currentMode} url={currentUrl} />
                </div>}
            </div>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <PreferencesTab />
          </TabsContent>
        </Tabs>

      </div>
    </MainLayout>;
};
export default Distribution;