import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import SurveyPicker from "@/components/surveys/SurveyPicker";
import QuickLinks from "@/components/surveys/QuickLinks";
import PreviewPane from "@/components/surveys/PreviewPane";
import SocialNetworkButtons from "@/components/surveys/SocialNetworkButtons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Mail, MessageCircle, Smartphone, ArrowRight, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import automationTemplates from "@/lib/automationTemplates";

const Distribution = () => {
  const navigate = useNavigate();

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

  // Customer response settings - up to 3 templates, each with multiple channels
  const [selectedTemplates, setSelectedTemplates] = useState<Array<{ 
    id: string; 
    channels: Array<'email' | 'whatsapp' | 'sms'> 
  }>>([]);

  // Get templates for lead trigger (questionnaire submissions)
  const templates = automationTemplates.getAll().filter(t => t.triggerType === "lead");
  
  // Helper functions for template management
  const addTemplate = (templateId: string) => {
    if (selectedTemplates.length >= 3) {
      toast.error("ניתן לבחור עד 3 תבניות בלבד");
      return;
    }
    setSelectedTemplates([...selectedTemplates, { id: templateId, channels: [] }]);
  };
  
  const removeTemplate = (index: number) => {
    setSelectedTemplates(selectedTemplates.filter((_, i) => i !== index));
  };
  
  const toggleChannelForTemplate = (templateIndex: number, channel: 'email' | 'whatsapp' | 'sms') => {
    setSelectedTemplates(prev => prev.map((template, idx) => {
      if (idx === templateIndex) {
        const channels = template.channels.includes(channel)
          ? template.channels.filter(c => c !== channel)
          : [...template.channels, channel];
        return { ...template, channels };
      }
      return template;
    }));
  };
  
  const isChannelUsedByOtherTemplates = (currentTemplateIndex: number, channel: 'email' | 'whatsapp' | 'sms') => {
    return selectedTemplates.some((t, idx) => 
      idx !== currentTemplateIndex && t.channels.includes(channel)
    );
  };
  
  const getUsedChannels = () => {
    return selectedTemplates.flatMap(t => t.channels);
  };
  
  const getAvailableChannels = (templateIndex: number): Array<'email' | 'whatsapp' | 'sms'> => {
    const allChannels: Array<'email' | 'whatsapp' | 'sms'> = ['email', 'whatsapp', 'sms'];
    return allChannels.filter(channel => 
      !isChannelUsedByOtherTemplates(templateIndex, channel)
    );
  };
  
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

  const handleSocialLinkGenerated = (url: string, network: string) => {
    // עדכון ה-URL הנוכחי לתצוגה מקדימה
    setCurrentUrl(url);
    setCurrentMode("form");
    
    toast.success(`קישור ${network} נוצר בהצלחה!`);
  };

  return (
    <MainLayout initialState="content">
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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">הפצת שאלונים</h1>
          <p className="text-muted-foreground">צור קישורי הפצה לשאלונים שלך ושתף אותם עם הלקוחות</p>
        </div>

        {/* חלק 1: בחרי שאלון */}
        <Card className="border shadow-md">
          <CardHeader>
            <CardTitle className="text-right">חלק 1: בחרי שאלון</CardTitle>
          </CardHeader>
          <CardContent>
            <SurveyPicker value={selectedSurveyId} onChange={setSelectedSurveyId} options={surveys} />
          </CardContent>
        </Card>

        {/* חלק 2: מענה אוטומטי */}
        <Card className="border shadow-md">
          <CardHeader>
            <CardTitle className="text-right">חלק 2: מענה אוטומטי</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">מענה אוטומטי</h3>
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
              <p className="text-sm text-muted-foreground text-right">
                ניתן לבחור עד 3 תבניות. כל תבנית ניתן לשייך לערוץ אחד או יותר (מייל, וואטסאפ, SMS). ערוץ שסומן בתבנית אחת לא יופיע בתבניות אחרות.
              </p>
            </div>

            {/* Selected Templates Display */}
            {selectedTemplates.length > 0 && (
              <div className="mb-6 space-y-3">
                <Label className="text-sm font-semibold">תבניות שנבחרו ({selectedTemplates.length}/3)</Label>
                <div className="space-y-3">
                  {selectedTemplates.map((template, index) => {
                    const templateData = templates.find(t => t.id === template.id);
                    const availableChannels = getAvailableChannels(index);
                    
                    return (
                      <div key={index} className="bg-muted/30 border border-border rounded-lg p-4">
                        {/* Template Name and Remove Button */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{templateData?.name}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeTemplate(index)}
                            className="text-destructive hover:text-destructive/80"
                          >
                            הסר
                          </Button>
                        </div>
                        
                        {/* Channel Selection */}
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">ערוצי שליחה</Label>
                          <div className="flex gap-2 flex-wrap">
                            {/* Email */}
                            <div 
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                                template.channels.includes('email')
                                  ? 'bg-blue-500 border-blue-600 text-white'
                                  : availableChannels.includes('email')
                                  ? 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
                                  : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                              }`}
                              onClick={() => {
                                if (availableChannels.includes('email') || template.channels.includes('email')) {
                                  toggleChannelForTemplate(index, 'email');
                                }
                              }}
                            >
                              <Checkbox 
                                checked={template.channels.includes('email')}
                                disabled={!availableChannels.includes('email') && !template.channels.includes('email')}
                                className="pointer-events-none"
                              />
                              <Mail className="h-4 w-4" />
                              <span className="text-sm font-medium">מייל</span>
                            </div>

                            {/* WhatsApp */}
                            <div 
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                                template.channels.includes('whatsapp')
                                  ? 'bg-green-500 border-green-600 text-white'
                                  : availableChannels.includes('whatsapp')
                                  ? 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100'
                                  : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                              }`}
                              onClick={() => {
                                if (availableChannels.includes('whatsapp') || template.channels.includes('whatsapp')) {
                                  toggleChannelForTemplate(index, 'whatsapp');
                                }
                              }}
                            >
                              <Checkbox 
                                checked={template.channels.includes('whatsapp')}
                                disabled={!availableChannels.includes('whatsapp') && !template.channels.includes('whatsapp')}
                                className="pointer-events-none"
                              />
                              <MessageCircle className="h-4 w-4" />
                              <span className="text-sm font-medium">וואטסאפ</span>
                            </div>

                            {/* SMS */}
                            <div 
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                                template.channels.includes('sms')
                                  ? 'bg-purple-500 border-purple-600 text-white'
                                  : availableChannels.includes('sms')
                                  ? 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100'
                                  : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                              }`}
                              onClick={() => {
                                if (availableChannels.includes('sms') || template.channels.includes('sms')) {
                                  toggleChannelForTemplate(index, 'sms');
                                }
                              }}
                            >
                              <Checkbox 
                                checked={template.channels.includes('sms')}
                                disabled={!availableChannels.includes('sms') && !template.channels.includes('sms')}
                                className="pointer-events-none"
                              />
                              <Smartphone className="h-4 w-4" />
                              <span className="text-sm font-medium">SMS</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add Template Section */}
            {selectedTemplates.length < 3 && getUsedChannels().length < 3 && (
              <div className="space-y-4">
                <Label className="text-sm font-semibold">הוסף תבנית ({selectedTemplates.length}/3)</Label>
                
                {/* Template Selection */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm mb-2 block">בחר תבנית מענה</Label>
                    <Select 
                      disabled={!selectedSurveyId}
                      onValueChange={(templateId) => {
                        addTemplate(templateId);
                      }}
                    >
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue placeholder={selectedSurveyId ? "בחר תבנית מענה" : "יש לבחור שאלון תחילה"} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50 border-border">
                        {templates.map(template => {
                          const alreadySelected = selectedTemplates.some(t => t.id === template.id);
                          return (
                            <SelectItem 
                              key={template.id} 
                              value={template.id}
                              disabled={alreadySelected}
                            >
                              {template.name}
                              {alreadySelected && " (כבר נבחרה)"}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {!selectedSurveyId && <p className="mt-4 text-xs text-muted-foreground text-right">יש לבחור שאלון כדי להפעיל מענה אוטומטי.</p>}
            
            {/* Message when all channels are used */}
            {selectedTemplates.length > 0 && getUsedChannels().length === 3 && selectedTemplates.length < 3 && (
              <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-800 text-right">
                  ⚠️ כל הערוצים בשימוש. מחק ערוץ או תבנית כדי להוסיף תבנית נוספת.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* חלק 3: יצירת קישורים */}
        <Card className="border shadow-md">
          <CardHeader>
            <CardTitle className="text-right">חלק 3: יצירת קישורים</CardTitle>
          </CardHeader>
          <CardContent>
            <QuickLinks
              currentUrl={currentUrl}
              onBuild={handleBuildLink}
              onCopy={handleCopyUrl}
              onPreview={handlePreviewLink}
              disabled={!selectedSurveyId}
            />
          </CardContent>
        </Card>

        {/* חלק 4: רשתות חברתיות */}
        <Card className="border shadow-md">
          <CardHeader>
            <CardTitle className="text-right">חלק 4: רשתות חברתיות</CardTitle>
          </CardHeader>
          <CardContent>
            <SocialNetworkButtons
              baseUrl={typeof window !== "undefined" ? window.location.origin : ""}
              surveyId={selectedSurveyId}
              onLinkGenerated={handleSocialLinkGenerated}
            />
          </CardContent>
        </Card>

        {/* Preview Pane */}
        {currentMode && currentUrl && (
          <Card className="border shadow-md">
            <CardHeader>
              <CardTitle className="text-right">תצוגה מקדימה</CardTitle>
            </CardHeader>
            <CardContent>
              <PreviewPane mode={currentMode} url={currentUrl} />
            </CardContent>
          </Card>
        )}

      </div>
    </MainLayout>
  );
};

export default Distribution;