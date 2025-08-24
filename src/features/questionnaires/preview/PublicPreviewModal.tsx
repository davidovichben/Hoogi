import { useEffect, useState } from "react";
import { fetchPublicQuestionnaireByToken, buildPublicUrl, generateQRCode, getEmbedCode } from "@/services/questionnaires";
import TemplateA from "../templates/TemplateA";
import TemplateB from "../templates/TemplateB";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useToast } from "../../../hooks/use-toast";
import { 
  Copy, 
  QrCode, 
  Share2, 
  ExternalLink, 
  Smartphone, 
  Monitor, 
  X,
  Globe,
  Eye
} from "lucide-react";

type Props = { token: string; onClose: () => void };

export default function PublicPreviewModal({ token, onClose }: Props) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [q, setQ] = useState<any>(null);
  const [tpl, setTpl] = useState<"A" | "B">("A");
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [embedCode, setEmbedCode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'preview' | 'share' | 'embed'>('preview');

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchPublicQuestionnaireByToken(token);
        if (!canceled) {
          setQ(data);
          // צור QR Code אוטומטית
          const publicUrl = buildPublicUrl(token);
          const qrUrl = await generateQRCode(publicUrl);
          setQrCodeUrl(qrUrl);
        }
      } catch (error) {
        console.error('Error loading questionnaire:', error);
        if (!canceled) {
          toast({
            title: language === 'he' ? 'שגיאה בטעינה' : 'Loading Error',
            description: language === 'he' 
              ? 'לא ניתן היה לטעון את השאלון' 
              : 'Could not load questionnaire',
            variant: 'destructive'
          });
        }
      } finally {
        if (!canceled) setLoading(false);
      }
    })();
    return () => { canceled = true; };
  }, [token, language, toast]);

  const publicUrl = buildPublicUrl(token);

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

  const generateEmbed = async () => {
    try {
      const embed = await getEmbedCode(publicUrl);
      setEmbedCode(embed);
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

  const openPublicLink = () => {
    window.open(publicUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl w-[800px] max-w-[95vw] h-[80vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg">{language === 'he' ? 'טוען שאלון...' : 'Loading questionnaire...'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!q) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl w-[400px] p-6 text-center">
          <h3 className="text-lg font-semibold mb-4">
            {language === 'he' ? 'שגיאה בטעינה' : 'Loading Error'}
          </h3>
          <p className="text-gray-600 mb-4">
            {language === 'he' 
              ? 'לא ניתן היה לטעון את השאלון' 
              : 'Could not load questionnaire'
            }
          </p>
          <Button onClick={onClose}>
            {language === 'he' ? 'סגור' : 'Close'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-[900px] max-w-[95vw] h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-semibold text-lg">
                {language === 'he' ? 'תצוגה מקדימה' : 'Preview'}
              </h2>
              <p className="text-sm text-gray-600">
                {language === 'he' ? 'איך יראה השאלון לציבור' : 'How the questionnaire will look to the public'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'preview'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Eye className="h-4 w-4 inline mr-2" />
            {language === 'he' ? 'תצוגה מקדימה' : 'Preview'}
          </button>
          <button
            onClick={() => setActiveTab('share')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'share'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Share2 className="h-4 w-4 inline mr-2" />
            {language === 'he' ? 'שיתוף' : 'Share'}
          </button>
          <button
            onClick={() => setActiveTab('embed')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'embed'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Globe className="h-4 w-4 inline mr-2" />
            {language === 'he' ? 'הטמעה' : 'Embed'}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <div className="h-full overflow-y-auto">
              <div className="p-4">
                {/* Template Selection */}
                <div className="mb-4 flex gap-2">
                  <Button
                    variant={tpl === "A" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTpl("A")}
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    {language === 'he' ? 'תבנית A' : 'Template A'}
                  </Button>
                  <Button
                    variant={tpl === "B" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTpl("B")}
                  >
                    <Smartphone className="h-4 w-4 mr-2" />
                    {language === 'he' ? 'תבנית B' : 'Template B'}
                  </Button>
                </div>

                {/* Questionnaire Preview */}
                <div className="border rounded-lg overflow-hidden">
                  {tpl === "A" ? <TemplateA q={q} /> : <TemplateB q={q} />}
                </div>
              </div>
            </div>
          )}

          {/* Share Tab */}
          {activeTab === 'share' && (
            <div className="h-full overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Public Link */}
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    {language === 'he' ? 'קישור ציבורי' : 'Public Link'}
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={publicUrl}
                      readOnly
                      className="flex-1 px-3 py-2 border rounded bg-gray-50 text-sm"
                    />
                    <Button 
                      size="sm" 
                      onClick={() => copyToClipboard(publicUrl, language === 'he' ? 'הקישור הועתק!' : 'Link copied!')}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      {language === 'he' ? 'העתק' : 'Copy'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={openPublicLink}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      {language === 'he' ? 'פתח' : 'Open'}
                    </Button>
                  </div>
                </div>

                {/* QR Code */}
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    {language === 'he' ? 'QR Code' : 'QR Code'}
                  </h3>
                  {qrCodeUrl && (
                    <div className="text-center">
                      <img src={qrCodeUrl} alt="QR Code" className="mx-auto border rounded-lg shadow-sm" />
                      <div className="mt-3 flex gap-2 justify-center">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copyToClipboard(qrCodeUrl, language === 'he' ? 'QR Code URL הועתק!' : 'QR Code URL copied!')}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          {language === 'he' ? 'העתק URL' : 'Copy URL'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(qrCodeUrl, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          {language === 'he' ? 'פתח' : 'Open'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="font-medium mb-3">
                    {language === 'he' ? 'פעולות מהירות' : 'Quick Actions'}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        const message = language === 'he' 
                          ? 'היי! אשמח לקבל את תשובותיך בקישור לשאלון:'
                          : 'Hi! I would love to get your answers via this questionnaire link:';
                        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message + '\n\n' + publicUrl)}`;
                        window.open(whatsappUrl, '_blank');
                      }}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      {language === 'he' ? 'שלח בוואטסאפ' : 'Send via WhatsApp'}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        const subject = language === 'he' ? 'שאלון קצר עבורכם' : 'Short questionnaire for you';
                        const body = language === 'he' 
                          ? 'שלום,\nאשמח למענה קצר על השאלון בקישור:\n'
                          : 'Hello,\nI would appreciate a quick response to the questionnaire via this link:\n';
                        const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body + publicUrl)}`;
                        window.location.href = mailtoUrl;
                      }}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      {language === 'he' ? 'שלח באימייל' : 'Send via Email'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Embed Tab */}
          {activeTab === 'embed' && (
            <div className="h-full overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    {language === 'he' ? 'קוד הטמעה' : 'Embed Code'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {language === 'he' 
                      ? 'העתק את הקוד הזה והטמע אותו באתר שלך' 
                      : 'Copy this code and embed it on your website'
                    }
                  </p>
                  
                  {!embedCode && (
                    <Button onClick={generateEmbed} className="mb-3">
                      <Globe className="h-4 w-4 mr-2" />
                      {language === 'he' ? 'צור קוד הטמעה' : 'Generate Embed Code'}
                    </Button>
                  )}

                  {embedCode && (
                    <div>
                      <textarea
                        value={embedCode}
                        readOnly
                        className="w-full h-32 p-3 border rounded bg-gray-50 font-mono text-sm"
                      />
                      <div className="mt-3 flex gap-2">
                        <Button 
                          onClick={() => copyToClipboard(embedCode, language === 'he' ? 'קוד הטמעה הועתק!' : 'Embed code copied!')}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          {language === 'he' ? 'העתק קוד' : 'Copy Code'}
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => setEmbedCode('')}
                        >
                          {language === 'he' ? 'צור מחדש' : 'Regenerate'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Preview of Embed */}
                {embedCode && (
                  <div>
                    <h3 className="font-medium mb-3">
                      {language === 'he' ? 'תצוגה מקדימה של ההטמעה' : 'Embed Preview'}
                    </h3>
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="text-sm text-gray-600 mb-2">
                        {language === 'he' ? 'כך יראה השאלון המוטמע:' : 'This is how the embedded questionnaire will look:'}
                      </div>
                      <div className="bg-white border rounded p-4">
                        <div className="text-center text-gray-500">
                          <Globe className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm">
                            {language === 'he' 
                              ? 'תצוגה מקדימה של השאלון המוטמע' 
                              : 'Embedded questionnaire preview'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 rounded-b-xl">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {language === 'he' 
                ? `שאלון: ${q?.title || 'ללא כותרת'}`
                : `Questionnaire: ${q?.title || 'Untitled'}`
              }
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                {language === 'he' ? 'סגור' : 'Close'}
              </Button>
              <Button onClick={openPublicLink}>
                <ExternalLink className="h-4 w-4 mr-2" />
                {language === 'he' ? 'פתח שאלון' : 'Open Questionnaire'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
