import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useToast } from '../../../hooks/use-toast';
import { 
  Globe, 
  Mail, 
  MessageCircle, 
  Share2, 
  Copy, 
  QrCode, 
  BarChart3,
  ExternalLink,
  CheckCircle
} from 'lucide-react';
import { 
  generateQRCode, 
  shareToWhatsApp, 
  shareToEmail, 
  shareToSocialMedia, 
  getEmbedCode,
  getQuestionnaireStats
} from '../../../services/questionnaires';

interface ChannelsPanelProps {
  questionnaire: any;
  selectedChannel: string;
  onChannelChange: (channel: string) => void;
  onDuplicateToChannel: (channel: string) => Promise<void>;
}

const channels = [
  { value: 'landing', label: { he: 'דף נחיתה', en: 'Landing Page' }, icon: Globe, description: { he: 'שאלון ציבורי עם קישור', en: 'Public questionnaire with link' } },
  { value: 'email', label: { he: 'אימייל', en: 'Email' }, icon: Mail, description: { he: 'שלח קישור באימייל', en: 'Send link via email' } },
  { value: 'whatsapp', label: { he: 'וואטסאפ', en: 'WhatsApp' }, icon: MessageCircle, description: { he: 'שלח קישור בוואטסאפ', en: 'Send link via WhatsApp' } },
  { value: 'embed', label: { he: 'הטמעה', en: 'Embed' }, icon: Share2, description: { he: 'הטמע באתר אחר', en: 'Embed in another website' } }
];

const socialChannels = [
  { value: 'facebook', label: { he: 'פייסבוק', en: 'Facebook' }, icon: Share2 },
  { value: 'twitter', label: { he: 'טוויטר', en: 'Twitter' }, icon: Share2 },
  { value: 'linkedin', label: { he: 'לינקדאין', en: 'LinkedIn' }, icon: Share2 },
  { value: 'telegram', label: { he: 'טלגרם', en: 'Telegram' }, icon: Share2 }
];

export function ChannelsPanel({ 
  questionnaire, 
  selectedChannel, 
  onChannelChange, 
  onDuplicateToChannel 
}: ChannelsPanelProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [embedCode, setEmbedCode] = useState<string>('');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const getLabel = (item: any) => language === 'he' ? item.label.he : item.label.en;
  const getDescription = (item: any) => language === 'he' ? item.description.he : item.description.en;

  // צור קישור ציבורי
  const publicUrl = useMemo(() => {
    if (!questionnaire?.public_token) return '';
    const origin = window.location.origin;
    return `${origin}/q/${questionnaire.public_token}`;
  }, [questionnaire?.public_token]);

  // טען סטטיסטיקות
  const loadStats = async () => {
    if (!questionnaire?.id) return;
    
    try {
      setLoading(true);
      const statsData = await getQuestionnaireStats(questionnaire.id);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // צור QR Code
  const generateQR = async () => {
    if (!publicUrl) return;
    
    try {
      const qrUrl = await generateQRCode(publicUrl);
      setQrCodeUrl(qrUrl);
    } catch (error) {
      toast({
        title: language === 'he' ? 'שגיאה' : 'Error',
        description: language === 'he' ? 'לא ניתן היה ליצור QR Code' : 'Could not generate QR Code',
        variant: 'destructive'
      });
    }
  };

  // צור קוד הטמעה
  const generateEmbed = async () => {
    if (!publicUrl) return;
    
    try {
      const embed = await getEmbedCode(publicUrl, {
        width: '100%',
        height: '900px',
        theme: 'light'
      });
      setEmbedCode(embed);
    } catch (error) {
      toast({
        title: language === 'he' ? 'שגיאה' : 'Error',
        description: language === 'he' ? 'לא ניתן היה ליצור קוד הטמעה' : 'Could not generate embed code',
        variant: 'destructive'
      });
    }
  };

  // העתק למועדפים
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
        description: language === 'he' ? 'לא ניתן היה להעתיק' : 'Could not copy',
        variant: 'destructive'
      });
    }
  };

  // שתף בוואטסאפ
  const handleWhatsAppShare = async () => {
    if (!publicUrl) return;
    
    const message = language === 'he' 
      ? 'היי! אשמח לקבל את תשובותיך בקישור לשאלון:'
      : 'Hi! I would love to get your answers via this questionnaire link:';
    
    await shareToWhatsApp(message, publicUrl);
  };

  // שתף באימייל
  const handleEmailShare = async () => {
    if (!publicUrl) return;
    
    const subject = language === 'he' ? 'שאלון קצר עבורכם' : 'Short questionnaire for you';
    const body = language === 'he' 
      ? 'שלום,\nאשמח למענה קצר על השאלון בקישור:\n'
      : 'Hello,\nI would appreciate a quick response to the questionnaire via this link:\n';
    
    await shareToEmail(subject, body, publicUrl);
  };

  // שתף ברשתות חברתיות
  const handleSocialShare = async (platform: string) => {
    if (!publicUrl) return;
    
    const text = language === 'he' 
      ? 'שאלון מעניין - אשמח לקבל את התשובות שלכם!'
      : 'Interesting questionnaire - I would love to get your answers!';
    
    await shareToSocialMedia(platform, publicUrl, text);
  };

  // פתח קישור ציבורי
  const openPublicLink = () => {
    if (publicUrl) {
      window.open(publicUrl, '_blank');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          {language === 'he' ? 'ערוצי הפצה' : 'Distribution Channels'}
        </CardTitle>
        <CardDescription>
          {language === 'he' ? 'בחר איך להפיץ את השאלון שלך' : 'Choose how to distribute your questionnaire'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ערוץ ראשי */}
        <div>
          <h3 className="font-medium mb-3">{language === 'he' ? 'ערוץ ראשי' : 'Main Channel'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {channels.map((channel) => {
              const IconComponent = channel.icon;
              const isSelected = selectedChannel === channel.value;
              
              return (
                <div
                  key={channel.value}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => onChannelChange(channel.value)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{getLabel(channel)}</div>
                      <div className="text-sm text-muted-foreground">{getDescription(channel)}</div>
                    </div>
                    {isSelected && <CheckCircle className="h-4 w-4 text-primary" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ערוץ נבחר */}
        {selectedChannel && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary">
                {language === 'he' ? 'ערוץ נבחר' : 'Selected Channel'}
              </Badge>
              <span className="font-medium">
                {getLabel(channels.find(c => c.value === selectedChannel)!)}
              </span>
            </div>

            {/* קישור ציבורי */}
            {publicUrl && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{language === 'he' ? 'קישור ציבורי:' : 'Public Link:'}</span>
                  <Button variant="outline" size="sm" onClick={openPublicLink}>
                    <ExternalLink className="h-3 w-3 mr-1" />
                    {language === 'he' ? 'פתח' : 'Open'}
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={publicUrl}
                    readOnly
                    className="flex-1 px-3 py-2 text-sm border rounded bg-background"
                  />
                  <Button 
                    size="sm" 
                    onClick={() => copyToClipboard(publicUrl, language === 'he' ? 'הקישור הועתק!' : 'Link copied!')}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {language === 'he' ? 'העתק' : 'Copy'}
                  </Button>
                </div>
              </div>
            )}

            {/* פעולות נוספות לפי הערוץ */}
            {selectedChannel === 'landing' && (
              <div className="mt-4 space-y-3">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={generateQR}>
                    <QrCode className="h-3 w-3 mr-1" />
                    {language === 'he' ? 'QR Code' : 'QR Code'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={generateEmbed}>
                    <Share2 className="h-3 w-3 mr-1" />
                    {language === 'he' ? 'קוד הטמעה' : 'Embed Code'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={loadStats}>
                    <BarChart3 className="h-3 w-3 mr-1" />
                    {language === 'he' ? 'סטטיסטיקות' : 'Stats'}
                  </Button>
                </div>

                {/* QR Code */}
                {qrCodeUrl && (
                  <div className="text-center">
                    <img src={qrCodeUrl} alt="QR Code" className="mx-auto border rounded" />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => copyToClipboard(qrCodeUrl, language === 'he' ? 'QR Code URL הועתק!' : 'QR Code URL copied!')}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      {language === 'he' ? 'העתק URL' : 'Copy URL'}
                    </Button>
                  </div>
                )}

                {/* קוד הטמעה */}
                {embedCode && (
                  <div>
                    <textarea
                      value={embedCode}
                      readOnly
                      className="w-full h-24 p-2 text-xs border rounded bg-muted font-mono"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => copyToClipboard(embedCode, language === 'he' ? 'קוד הטמעה הועתק!' : 'Embed code copied!')}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      {language === 'he' ? 'העתק קוד' : 'Copy Code'}
                    </Button>
                  </div>
                )}

                {/* סטטיסטיקות */}
                {stats && (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-background rounded">
                      <div className="text-lg font-bold">{stats.total_responses}</div>
                      <div className="text-xs text-muted-foreground">{language === 'he' ? 'סה"כ תשובות' : 'Total'}</div>
                    </div>
                    <div className="p-2 bg-background rounded">
                      <div className="text-lg font-bold">{stats.today_responses}</div>
                      <div className="text-xs text-muted-foreground">{language === 'he' ? 'היום' : 'Today'}</div>
                    </div>
                    <div className="p-2 bg-background rounded">
                      <div className="text-lg font-bold">{Object.keys(stats.channels).length}</div>
                      <div className="text-xs text-muted-foreground">{language === 'he' ? 'ערוצים' : 'Channels'}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedChannel === 'whatsapp' && (
              <div className="mt-4">
                <Button onClick={handleWhatsAppShare} className="w-full">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {language === 'he' ? 'שתף בוואטסאפ' : 'Share on WhatsApp'}
                </Button>
              </div>
            )}

            {selectedChannel === 'email' && (
              <div className="mt-4">
                <Button onClick={handleEmailShare} className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  {language === 'he' ? 'שתף באימייל' : 'Share via Email'}
                </Button>
              </div>
            )}

            {selectedChannel === 'embed' && (
              <div className="mt-4">
                <Button onClick={generateEmbed} className="w-full">
                  <Share2 className="h-4 w-4 mr-2" />
                  {language === 'he' ? 'צור קוד הטמעה' : 'Generate Embed Code'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* רשתות חברתיות */}
        <div>
          <h3 className="font-medium mb-3">{language === 'he' ? 'שתף ברשתות חברתיות' : 'Share on Social Media'}</h3>
          <div className="flex gap-2">
            {socialChannels.map((channel) => {
              const IconComponent = channel.icon;
              
              return (
                <Button
                  key={channel.value}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleSocialShare(channel.value)}
                >
                  <IconComponent className="h-4 w-4 mr-2" />
                  {getLabel(channel)}
                </Button>
              );
            })}
          </div>
        </div>

        {/* עזרה */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Share2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">
                {language === 'he' ? 'עצות להפצה' : 'Distribution Tips'}
              </p>
              <ul className="mt-1 space-y-1">
                <li>• {language === 'he' ? 'בחר ערוץ ראשי שמתאים לקהל היעד שלך' : 'Choose a primary channel that fits your target audience'}</li>
                <li>• {language === 'he' ? 'העתקה לערוץ נוסף יוצרת עותק נפרד' : 'Duplicating to another channel creates a separate copy'}</li>
                <li>• {language === 'he' ? 'השתמש ברשתות חברתיות להגברת החשיפה' : 'Use social media to increase exposure'}</li>
                <li>• {language === 'he' ? 'בדוק את הקישור לפני השיתוף' : 'Test the link before sharing'}</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
