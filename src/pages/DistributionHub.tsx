import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { Copy, Download, QrCode, MessageSquare, Mail, Link as LinkIcon } from 'lucide-react';

// UUID validation function
const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

// Types
type Questionnaire = {
  id: string;
  title: string;
  lang: string;
};

type TabType = 'link' | 'qr' | 'wa' | 'mail';

const DistributionHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // State
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [questionnairesList, setQuestionnairesList] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [lang, setLang] = useState<string>('he');
  const [ref, setRef] = useState<string>('landing');
  const [tab, setTab] = useState<TabType>('link');
  const [copied, setCopied] = useState<string | null>(null);
  
  // Get questionnaire ID from URL
  const qid = searchParams.get('qid');
  
  // Build share URL
  const shareUrl = useMemo(() => {
    if (!qid) return '';
    return `${window.location.origin}/q/${qid}?lang=${lang}&ref=${ref}`;
  }, [qid, lang, ref]);
  
  // Fetch questionnaire data
  useEffect(() => {
    const doFetch = async () => {
      if (!qid || !isUuid(qid)) { 
        setQuestionnaire(null); 
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
          .maybeSingle(); // נמנע מ-406
        
        if (fetchError) throw fetchError;
        
        setQuestionnaire(data);
        // Set language from questionnaire if available
        if (data?.lang) {
          setLang(data.lang);
        }
      } catch (err) {
        console.error('Failed to fetch questionnaire:', err);
        setError(err instanceof Error ? err.message : 'שגיאה בטעינת השאלון');
      } finally {
        setLoading(false);
      }
    };
    
    doFetch();
  }, [qid]);
  
  // Fetch user's questionnaires list
  useEffect(() => {
    const fetchQuestionnairesList = async () => {
      try {
        const { data, error } = await supabase
          .from('questionnaires')
          .select('id, title')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setQuestionnairesList(data || []);
      } catch (err) {
        console.error('Failed to fetch questionnaires list:', err);
      }
    };
    
    fetchQuestionnairesList();
  }, []);
  
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
  
  // Share logging function
  const logShare = async (channel: 'landing' | 'whatsapp' | 'mail' | 'qr' | 'other', shareUrl: string) => {
    try {
      if (!qid) return;
      await supabase.from('share_logs').insert([{
        questionnaire_id: qid,
        channel,
        lang,
        ref,
        share_url: shareUrl
      }]);
    } catch (e) { 
      console.error('share log failed', e); 
    }
  };
  
  // Handle questionnaire selection
  const handleQuestionnaireSelect = (selectedQid: string) => {
    navigate(`/distribute?qid=${selectedQid}`);
  };
  
  // Tab buttons
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'link', label: 'קישור', icon: <LinkIcon className="h-4 w-4" /> },
    { id: 'qr', label: 'QR', icon: <QrCode className="h-4 w-4" /> },
    { id: 'wa', label: 'WhatsApp', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'mail', label: 'אימייל', icon: <Mail className="h-4 w-4" /> }
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
        <div className="container mx-auto p-4 md:p-6">
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
        <div className="container mx-auto p-4 md:p-6">
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
        <div className="container mx-auto p-4 md:p-6">
          <div className="text-center py-12">
            <div className="text-muted-foreground text-6xl mb-4">🔗</div>
            <h1 className="text-2xl font-bold text-foreground mb-2">הפצה</h1>
            <p className="text-muted-foreground mb-6">יש לבחור שאלון להפצה</p>
            
            {questionnairesList.length > 0 && (
              <div className="max-w-md mx-auto space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2 text-right">
                    בחר שאלון
                  </label>
                  <select
                    onChange={(e) => handleQuestionnaireSelect(e.target.value)}
                    className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 text-right"
                    defaultValue=""
                  >
                    <option value="" disabled>בחר שאלון...</option>
                    {questionnairesList.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.title}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={() => {
                    const firstQ = questionnairesList[0];
                    if (firstQ) {
                      handleQuestionnaireSelect(firstQ.id);
                    }
                  }}
                  className="h-10 px-6 bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 transition-colors text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2"
                >
                  עבור להפצה
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">הפצה</h1>
          {questionnaire && (
            <p className="text-lg text-muted-foreground">{questionnaire.title}</p>
          )}
        </div>
        
        {/* Top Controls Card */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            {/* Language & Ref Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2 text-right">
                  שפה
                </label>
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 text-right"
                  aria-label="בחר שפה"
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
                  className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 text-right"
                  aria-label="בחר מקור הפניה"
                >
                  {refOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Live Share URL */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2 text-right">
                קישור שיתוף
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <code 
                    className="block w-full h-10 px-3 py-2 bg-muted border border-border rounded-xl text-sm font-mono overflow-x-auto whitespace-nowrap leading-6"
                    style={{ direction: 'ltr' }}
                  >
                    {shareUrl}
                  </code>
                </div>
                <div className="relative">
                  <button
                    onClick={() => {
                      copyToClipboard(shareUrl, 'link');
                      logShare(ref as any, shareUrl);
                    }}
                    className="h-10 px-4 bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2"
                    aria-label="העתק קישור"
                  >
                    <Copy className="h-4 w-4" />
                    העתק
                  </button>
                  {copied === 'link' && (
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap">
                      הועתק!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-4 gap-2 mb-8 md:flex md:flex-wrap md:justify-center md:gap-2">
            {tabs.map((tabItem) => (
              <button
                key={tabItem.id}
                onClick={() => setTab(tabItem.id)}
                className={`h-10 px-3 md:px-6 rounded-2xl border transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium ${
                  tab === tabItem.id
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                    : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:bg-primary/5'
                } focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2`}
                aria-label={`עבור לטאב ${tabItem.label}`}
              >
                {tabItem.icon}
                <span className="hidden sm:inline">{tabItem.label}</span>
              </button>
            ))}
          </div>
          
          {/* Tab Content */}
          <div className="bg-card border border-border rounded-xl p-4 md:p-6">
            {/* Link Tab */}
            {tab === 'link' && (
              <div className="text-center space-y-4">
                <div className="text-6xl mb-4">🔗</div>
                <h3 className="text-xl font-semibold">קישור ישיר</h3>
                <p className="text-muted-foreground">הקישור מוכן לשיתוף</p>
                <div className="bg-muted p-4 rounded-lg text-left">
                  <code 
                    className="block text-sm font-mono overflow-x-auto whitespace-nowrap"
                    style={{ direction: 'ltr' }}
                  >
                    {shareUrl}
                  </code>
                </div>
                <div className="relative">
                  <button
                    onClick={() => {
                      copyToClipboard(shareUrl, 'link');
                      logShare(ref as any, shareUrl);
                    }}
                    className="h-10 px-6 bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 transition-colors flex items-center gap-2 mx-auto text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2"
                    aria-label="העתק קישור"
                  >
                    <Copy className="h-4 w-4" />
                    העתק קישור
                  </button>
                  {copied === 'link' && (
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap">
                      הועתק!
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* QR Tab */}
            {tab === 'qr' && (
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
                    className="h-10 px-6 bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2"
                    aria-label="הורדת PNG"
                    onClick={() => logShare('qr', shareUrl)}
                  >
                    <Download className="h-4 w-4" />
                    הורדת PNG
                  </a>
                </div>
              </div>
            )}
            
            {/* WhatsApp Tab */}
            {tab === 'wa' && (
              <div className="text-center space-y-4">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold">שיתוף ב-WhatsApp</h3>
                <p className="text-muted-foreground">שלח את השאלון בווטסאפ</p>
                
                <div className="bg-muted p-4 rounded-lg text-right">
                  <p className="text-sm text-muted-foreground mb-2">הודעה לדוגמה:</p>
                  <p className="font-medium">
                    שלום! נשמח לשמוע ממך, הנה שאלון קצר: {shareUrl}
                  </p>
                </div>
                
                <div className="flex gap-2 justify-center flex-wrap">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `שלום! נשמח לשמוע ממך, הנה שאלון קצר: ${shareUrl}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 px-6 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium focus-visible:ring-2 focus-visible:ring-green-600/20 focus-visible:ring-offset-2"
                    aria-label="פתח WhatsApp"
                    onClick={() => logShare('whatsapp', shareUrl)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    פתח WhatsApp
                  </a>
                  
                  <div className="relative">
                    <button
                      onClick={() => {
                        copyToClipboard(
                          `שלום! נשמח לשמוע ממך, הנה שאלון קצר: ${shareUrl}`,
                          'whatsapp'
                        );
                        logShare('whatsapp', shareUrl);
                      }}
                      className="h-10 px-6 bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2"
                      aria-label="העתק הודעה"
                    >
                      <Copy className="h-4 w-4" />
                      העתק הודעה
                    </button>
                    {copied === 'whatsapp' && (
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap">
                        הועתק!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Email Tab */}
            {tab === 'mail' && (
              <div className="text-center space-y-4">
                <div className="text-6xl mb-4">✉️</div>
                <h3 className="text-xl font-semibold">שיתוף באימייל</h3>
                <p className="text-muted-foreground">שלח את השאלון באימייל</p>
                
                <div className="bg-muted p-4 rounded-lg text-right space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">נושא:</p>
                    <p className="font-medium">
                      {questionnaire?.title || ''} – Questionnaire
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">תוכן:</p>
                    <p className="text-sm">
                      שלום, אשמח שתמלא/י את השאלון: {shareUrl}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2 justify-center flex-wrap">
                  <a
                    href={`mailto:?subject=${encodeURIComponent(
                      `${questionnaire?.title || ''} – Questionnaire`
                    )}&body=${encodeURIComponent(
                      `שלום, אשמח שתמלא/י את השאלון: ${shareUrl}`
                    )}`}
                    className="h-10 px-6 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium focus-visible:ring-2 focus-visible:ring-blue-600/20 focus-visible:ring-offset-2"
                    aria-label="פתח מייל"
                    onClick={() => logShare('mail', shareUrl)}
                  >
                    <Mail className="h-4 w-4" />
                    פתח מייל
                  </a>
                  
                  <div className="relative">
                    <button
                      onClick={() => {
                        copyToClipboard(
                          `${questionnaire?.title || ''} – Questionnaire`,
                          'subject'
                        );
                        logShare('mail', shareUrl);
                      }}
                      className="h-10 px-6 bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2"
                      aria-label="העתק נושא"
                    >
                      <Copy className="h-4 w-4" />
                      העתק נושא
                    </button>
                    {copied === 'subject' && (
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap">
                        הועתק!
                      </div>
                    )}
                  </div>
                  
                  <div className="relative">
                    <button
                      onClick={() => {
                        copyToClipboard(
                          `שלום, אשמח שתמלא/י את השאלון: ${shareUrl}`,
                          'body'
                        );
                        logShare('mail', shareUrl);
                      }}
                      className="h-10 px-6 bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2"
                      aria-label="העתק תוכן"
                    >
                      <Copy className="h-4 w-4" />
                      העתק תוכן
                    </button>
                    {copied === 'body' && (
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap">
                        הועתק!
                      </div>
                    )}
                  </div>
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
