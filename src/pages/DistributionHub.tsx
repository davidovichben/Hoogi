import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { Copy, Download, ExternalLink, QrCode, Share2, Mail, MessageSquare, Link as LinkIcon } from 'lucide-react';

// Types
type Questionnaire = {
  id: string;
  title: string;
  lang: string;
};

type TabType = 'link' | 'qr' | 'whatsapp' | 'email';

const DistributionHub: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI State
  const [activeTab, setActiveTab] = useState<TabType>('link');
  const [language, setLanguage] = useState<string>('he');
  const [ref, setRef] = useState<string>('landing');
  const [copied, setCopied] = useState<string | null>(null);
  
  // Get questionnaire ID from URL
  const qid = searchParams.get('qid');
  
  // Build share URL
  const shareUrl = qid ? `${window.location.origin}/q/${qid}?lang=${language}&ref=${ref}` : '';
  
  // Fetch questionnaire data
  useEffect(() => {
    const fetchQuestionnaire = async () => {
      if (!qid) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const { data, error: fetchError } = await supabase
          .from('questionnaires')
          .select('id, title, lang')
          .eq('id', qid)
          .single();
        
        if (fetchError) throw fetchError;
        
        setQuestionnaire(data);
        // Set language from questionnaire if available
        if (data.lang) {
          setLanguage(data.lang);
        }
      } catch (err) {
        console.error('Failed to fetch questionnaire:', err);
        setError(err instanceof Error ? err.message : 'שגיאה בטעינת השאלון');
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuestionnaire();
  }, [qid]);
  
  // Copy to clipboard function
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  // Tab buttons
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'link', label: 'קישור', icon: <LinkIcon className="h-4 w-4" /> },
    { id: 'qr', label: 'QR', icon: <QrCode className="h-4 w-4" /> },
    { id: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'email', label: 'אימייל', icon: <Mail className="h-4 w-4" /> }
  ];
  
  // Ref options
  const refOptions = [
    { value: 'landing', label: 'Landing Page' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'mail', label: 'אימייל' },
    { value: 'qr', label: 'QR Code' },
    { value: 'other', label: 'אחר' }
  ];
  
  // Language options
  const languageOptions = [
    { value: 'he', label: 'עברית' },
    { value: 'en', label: 'English' }
  ];
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <div className="container mx-auto p-4 sm:p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">טוען...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <div className="container mx-auto p-4 sm:p-6">
          <div className="text-center py-12">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-foreground mb-2">שגיאה בטעינה</h1>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!qid) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <div className="container mx-auto p-4 sm:p-6">
          <div className="text-center py-12">
            <div className="text-muted-foreground text-6xl mb-4">🔗</div>
            <h1 className="text-2xl font-bold text-foreground mb-2">הפצה</h1>
            <p className="text-muted-foreground">יש לבחור שאלון להפצה</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">הפצה</h1>
          {questionnaire && (
            <p className="text-lg text-muted-foreground">{questionnaire.title}</p>
          )}
        </div>
        
        {/* Controls */}
        <div className="max-w-2xl mx-auto mb-8 space-y-4">
          {/* Language & Ref Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2 text-right">
                שפה
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full h-10 px-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-right"
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2 text-right">
                מקור הפניה
              </label>
              <select
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                className="w-full h-10 px-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-right"
              >
                {refOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Share URL Preview */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2 text-right">
              קישור שיתוף
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 h-10 px-3 bg-muted border border-border rounded-lg text-sm text-right overflow-x-auto"
              />
              <button
                onClick={() => copyToClipboard(shareUrl, 'link')}
                className="h-10 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                {copied === 'link' ? 'הועתק!' : 'העתק'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`h-10 px-6 rounded-lg border transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* Tab Content */}
          <div className="bg-card border border-border rounded-lg p-6">
            {/* Link Tab */}
            {activeTab === 'link' && (
              <div className="text-center space-y-4">
                <div className="text-6xl mb-4">🔗</div>
                <h3 className="text-xl font-semibold">קישור ישיר</h3>
                <p className="text-muted-foreground">הקישור מוכן לשיתוף</p>
                <div className="bg-muted p-4 rounded-lg break-all text-sm font-mono text-right">
                  {shareUrl}
                </div>
                <button
                  onClick={() => copyToClipboard(shareUrl, 'link')}
                  className="h-10 px-6 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 mx-auto"
                >
                  <Copy className="h-4 w-4" />
                  {copied === 'link' ? 'הועתק!' : 'העתק קישור'}
                </button>
              </div>
            )}
            
            {/* QR Tab */}
            {activeTab === 'qr' && (
              <div className="text-center space-y-4">
                <div className="text-6xl mb-4">📱</div>
                <h3 className="text-xl font-semibold">QR Code</h3>
                <p className="text-muted-foreground">סרוק את הקוד עם הטלפון</p>
                
                {shareUrl && (
                  <div className="flex justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(shareUrl)}`}
                      alt="QR Code"
                      className="border border-border rounded-lg"
                    />
                  </div>
                )}
                
                <div className="flex gap-2 justify-center">
                  <a
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(shareUrl)}`}
                    download="qr-code.png"
                    className="h-10 px-6 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    הורד PNG
                  </a>
                </div>
              </div>
            )}
            
            {/* WhatsApp Tab */}
            {activeTab === 'whatsapp' && (
              <div className="text-center space-y-4">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold">שיתוף ב-WhatsApp</h3>
                <p className="text-muted-foreground">שלח את השאלון בווטסאפ</p>
                
                <div className="bg-muted p-4 rounded-lg text-right">
                  <p className="text-sm text-muted-foreground mb-2">הודעה לדוגמה:</p>
                  <p className="font-medium">
                    {questionnaire?.title || 'שאלון חדש'}
                  </p>
                  <p className="text-sm mt-2">{shareUrl}</p>
                </div>
                
                <div className="flex gap-2 justify-center">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `${questionnaire?.title || 'שאלון חדש'}\n\n${shareUrl}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 px-6 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    פתח WhatsApp
                  </a>
                  
                  <button
                    onClick={() => copyToClipboard(
                      `${questionnaire?.title || 'שאלון חדש'}\n\n${shareUrl}`,
                      'whatsapp'
                    )}
                    className="h-10 px-6 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    {copied === 'whatsapp' ? 'הועתק!' : 'העתק הודעה'}
                  </button>
                </div>
              </div>
            )}
            
            {/* Email Tab */}
            {activeTab === 'email' && (
              <div className="text-center space-y-4">
                <div className="text-6xl mb-4">✉️</div>
                <h3 className="text-xl font-semibold">שיתוף באימייל</h3>
                <p className="text-muted-foreground">שלח את השאלון באימייל</p>
                
                <div className="bg-muted p-4 rounded-lg text-right space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">נושא:</p>
                    <p className="font-medium">
                      {questionnaire?.title || 'שאלון חדש'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">תוכן:</p>
                    <p className="text-sm">
                      שלום! אני מזמין אותך למלא שאלון חשוב.\n\n{shareUrl}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2 justify-center flex-wrap">
                  <a
                    href={`mailto:?subject=${encodeURIComponent(
                      questionnaire?.title || 'שאלון חדש'
                    )}&body=${encodeURIComponent(
                      `שלום! אני מזמין אותך למלא שאלון חשוב.\n\n${shareUrl}`
                    )}`}
                    className="h-10 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    פתח אימייל
                  </a>
                  
                  <button
                    onClick={() => copyToClipboard(
                      questionnaire?.title || 'שאלון חדש',
                      'subject'
                    )}
                    className="h-10 px-6 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    {copied === 'subject' ? 'הועתק!' : 'העתק נושא'}
                  </button>
                  
                  <button
                    onClick={() => copyToClipboard(
                      `שלום! אני מזמין אותך למלא שאלון חשוב.\n\n${shareUrl}`,
                      'body'
                    )}
                    className="h-10 px-6 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    {copied === 'body' ? 'הועתק!' : 'העתק תוכן'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DistributionHub;
