import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Switch } from "../../../components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Textarea } from "../../../components/ui/textarea";
import { Badge } from "../../../components/ui/badge";
import { Zap, Mail, MessageCircle, Clock, Save, Settings } from "lucide-react";
import { useToast } from "../../../hooks/use-toast";
import { useLanguage } from "../../../contexts/LanguageContext";

interface AutomationPanelProps {
  questionnaire: any;
  automationSettings: any;
  onUpdate: (settings: any) => void;
}

const emailTemplates = [
  { value: 'welcome', label: { he: 'ברוכים הבאים', en: 'Welcome' } },
  { value: 'reminder', label: { he: 'תזכורת', en: 'Reminder' } },
  { value: 'follow_up', label: { he: 'מעקב', en: 'Follow Up' } },
  { value: 'custom', label: { he: 'מותאם אישית', en: 'Custom' } }
];

const whatsappTemplates = [
  { value: 'welcome_wa', label: { he: 'ברוכים הבאים', en: 'Welcome' } },
  { value: 'reminder_wa', label: { he: 'תזכורת', en: 'Reminder' } },
  { value: 'follow_up_wa', label: { he: 'מעקב', en: 'Follow Up' } },
  { value: 'custom_wa', label: { he: 'מותאם אישית', en: 'Custom' } }
];

export function AutomationPanel({ questionnaire, automationSettings, onUpdate }: AutomationPanelProps) {
  const { toast } = useToast();
  const { language } = useLanguage();
  
  // Safe defaults for automation settings
  const safeAutomationSettings = automationSettings || {};
  
  const [settings, setSettings] = useState({
    email: {
      enabled: safeAutomationSettings.email?.enabled || false,
      subject: safeAutomationSettings.email?.subject || '',
      body: safeAutomationSettings.email?.body || '',
      delay: safeAutomationSettings.email?.delay || 0,
      template: safeAutomationSettings.email?.template || 'welcome'
    },
    whatsapp: {
      enabled: safeAutomationSettings.whatsapp?.enabled || false,
      body: safeAutomationSettings.whatsapp?.body || '',
      delay: safeAutomationSettings.whatsapp?.delay || 0,
      template: safeAutomationSettings.whatsapp?.template || 'welcome_wa'
    }
  });

  const [saving, setSaving] = useState(false);

  // Auto-save when settings change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (JSON.stringify(settings) !== JSON.stringify(safeAutomationSettings)) {
        handleSave();
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onUpdate(settings);
      
      toast({
        title: language === 'he' ? 'נשמר' : 'Saved',
        description: language === 'he' 
          ? 'הגדרות האוטומציה נשמרו בהצלחה' 
          : 'Automation settings saved successfully'
      });
    } catch (error) {
      toast({
        title: language === 'he' ? 'שגיאה בשמירה' : 'Save error',
        description: language === 'he' 
          ? 'לא ניתן היה לשמור את הגדרות האוטומציה' 
          : 'Could not save automation settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const getLabel = (item: any) => {
    return typeof item.label === 'string' ? item.label : item.label[language] || item.label.en;
  };

  const updateEmailSetting = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      email: { ...prev.email, [field]: value }
    }));
  };

  const updateWhatsAppSetting = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      whatsapp: { ...prev.whatsapp, [field]: value }
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          {language === 'he' ? 'אוטומציה' : 'Automation'}
        </CardTitle>
        <CardDescription>
          {language === 'he' 
            ? 'הגדר תגובות אוטומטיות לשאלונים' 
            : 'Configure automatic responses to questionnaires'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Automation */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <h4 className="font-medium">
                {language === 'he' ? 'אוטומציה באימייל' : 'Email Automation'}
              </h4>
            </div>
            <Switch
              checked={settings.email.enabled}
              onCheckedChange={(checked) => updateEmailSetting('enabled', checked)}
            />
          </div>

          {settings.email.enabled && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="email-template">
                    {language === 'he' ? 'תבנית' : 'Template'}
                  </Label>
                  <Select
                    value={settings.email.template}
                    onValueChange={(value) => updateEmailSetting('template', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {emailTemplates.map((template) => (
                        <SelectItem key={template.value} value={template.value}>
                          {getLabel(template)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="email-delay">
                    {language === 'he' ? 'עיכוב (דקות)' : 'Delay (minutes)'}
                  </Label>
                  <Input
                    id="email-delay"
                    type="number"
                    min="0"
                    value={settings.email.delay}
                    onChange={(e) => updateEmailSetting('delay', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email-subject">
                  {language === 'he' ? 'נושא' : 'Subject'}
                </Label>
                <Input
                  id="email-subject"
                  value={settings.email.subject}
                  onChange={(e) => updateEmailSetting('subject', e.target.value)}
                  placeholder={language === 'he' ? 'הקלד נושא...' : 'Enter subject...'}
                />
              </div>

              <div>
                <Label htmlFor="email-body">
                  {language === 'he' ? 'תוכן' : 'Body'}
                </Label>
                <Textarea
                  id="email-body"
                  value={settings.email.body}
                  onChange={(e) => updateEmailSetting('body', e.target.value)}
                  placeholder={language === 'he' ? 'הקלד תוכן...' : 'Enter body content...'}
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        {/* WhatsApp Automation */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <h4 className="font-medium">
                {language === 'he' ? 'אוטומציה בוואטסאפ' : 'WhatsApp Automation'}
              </h4>
            </div>
            <Switch
              checked={settings.whatsapp.enabled}
              onCheckedChange={(checked) => updateWhatsAppSetting('enabled', checked)}
            />
          </div>

          {settings.whatsapp.enabled && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="whatsapp-template">
                    {language === 'he' ? 'תבנית' : 'Template'}
                  </Label>
                  <Select
                    value={settings.whatsapp.template}
                    onValueChange={(value) => updateWhatsAppSetting('template', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {whatsappTemplates.map((template) => (
                        <SelectItem key={template.value} value={template.value}>
                          {getLabel(template)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="whatsapp-delay">
                    {language === 'he' ? 'עיכוב (דקות)' : 'Delay (minutes)'}
                  </Label>
                  <Input
                    id="whatsapp-delay"
                    type="number"
                    min="0"
                    value={settings.whatsapp.delay}
                    onChange={(e) => updateWhatsAppSetting('delay', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="whatsapp-body">
                  {language === 'he' ? 'תוכן ההודעה' : 'Message Content'}
                </Label>
                <Textarea
                  id="whatsapp-body"
                  value={settings.whatsapp.body}
                  onChange={(e) => updateWhatsAppSetting('body', e.target.value)}
                  placeholder={language === 'he' ? 'הקלד תוכן ההודעה...' : 'Enter message content...'}
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800">
              {language === 'he' 
                ? 'הגדרות נשמרות אוטומטית' 
                : 'Settings save automatically'
              }
            </span>
          </div>
          
          {saving && (
            <div className="flex items-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">
                {language === 'he' ? 'שומר...' : 'Saving...'}
              </span>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-700">
              <p className="font-medium">
                {language === 'he' ? 'עצות לאוטומציה' : 'Automation Tips'}
              </p>
              <ul className="mt-1 space-y-1">
                <li>• {language === 'he' ? 'הפעל אוטומציה רק לאחר שבדקת את התגובות' : 'Enable automation only after testing responses'}</li>
                <li>• {language === 'he' ? 'השתמש בעיכוב כדי לתת זמן למשתמשים לענות' : 'Use delays to give users time to respond'}</li>
                <li>• {language === 'he' ? 'בדוק תבניות לפני השימוש' : 'Test templates before using them'}</li>
                <li>• {language === 'he' ? 'שמור על תגובות קצרות וברורות' : 'Keep responses short and clear'}</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
