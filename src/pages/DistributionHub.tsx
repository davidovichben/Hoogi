import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { buildDistributeUrl, openShare, Channel } from '../lib/share';
import { buildPublicUrl, buildEditUrl, buildQrApiUrl } from '../lib/publicUrl';
import ShareDialog from '../components/ShareDialog';
import AdvancedShare from '@/components/AdvancedShare';
import { toast, announce } from '@/components/ui/Toaster';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Share2, Copy, Eye, Edit, Download, QrCode,
  MessageCircle, Mail, Instagram, Facebook,
  Linkedin, Globe, Settings, BarChart3, Zap
} from 'lucide-react';
import { rpcGetDistributionLinks, rpcPublishQuestionnaire, safeToast } from "@/lib/rpc";
import { getBaseUrl } from "@/lib/baseUrl";
import { previewAny, publishThen, getPublishState } from "@/lib/preview";

// טיפוסים
export type QMin = { id: string; public_token: string; title: string };
export type Lang = 'he' | 'en';

export default function DistributionHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL param (אופציונלי)
  const urlToken = searchParams.get('token') ?? undefined;

  // מצב נתונים
  const [list, setList] = useState<QMin[]>([]);
  const [current, setCurrent] = useState<QMin | null>(null);
  const [lang, setLang] = useState<Lang>('he');
  const [ref, setRef] = useState<string>('landing');

  // טעינה/שגיאות קטנות
  const [loading, setLoading] = useState<boolean>(false);
  const [inlineMsg, setInlineMsg] = useState<string | null>(null);

  // דיאלוג בחירת מודל אימייל
  const [emailDialogOpen, setEmailDialogOpen] = useState<boolean>(false);
  // דיאלוג שיתוף
  const [shareOpen, setShareOpen] = useState<boolean>(false);

  // --- Guard נגד 400: נטען userId לפני כל שאילתות ---
  const [userId, setUserId] = useState<string | null>(null);
  const [shareLinks, setShareLinks] = useState<{ web_url: string; whatsapp_url: string; mailto_url: string } | null>(null);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [publishState, setPublishState] = useState<{ token: string | null; is_published: boolean }>({ token: null, is_published: false });

  useEffect(() => {
    let cancel = false;
    supabase.auth.getUser().then(({ data, error }) => {
      if (!cancel && !error) setUserId(data.user?.id ?? null);
    });
    return () => { cancel = true; };
  }, []);

  // טעינת רשימה מה־view
  useEffect(() => {
    if (!userId) return; // אל תשלח שאילתות לפני שיש משתמש
    let ignore = false;
    (async () => {
      setLoading(true); setInlineMsg(null);
      try {
        // שאלונים
        const { data: qs, error: qErr } = await supabase
          .from("questionnaires")
          .select("id,title,created_at")
          .eq("owner_id", userId)
          .order("created_at", { ascending: false });
        if (qErr) {
          console.error("[Distribute] questionnaires error:", { message: qErr.message, details: qErr.details, hint: qErr.hint });
          throw qErr;
        }

        // שותפים (אם יש)
        // Note: There's no existing 'partners' state or usage in the provided DistributionHub.tsx.
        // Assuming 'partners' logic is intended for DistributionBuilder.tsx or similar.
        // For now, I'm adding a placeholder to avoid build errors if it's meant to be here.
        const ps: any[] = []; // Placeholder for partners data

        // If you intended to load partners from Supabase here, uncomment and complete this section:
        /*
        const { data: ps, error: pErr } = await supabase
          .from("partners")
          .select("id,name,code,created_at")
          .eq("owner_id", userId)
          .order("created_at", { ascending: false });
        if (pErr) {
          console.error("[Distribute] partners error:", { message: pErr.message, details: pErr.details, hint: pErr.hint });
          throw pErr;
        }
        */

        if (!ignore) {
          setList(qs ?? []); // Assuming qs is the questionnaire list
          // setPartners(ps ?? []); // Uncomment if partners state is added
        }
      } catch (e: any) {
        if (!ignore) setInlineMsg(e?.message ?? 'שגיאה בטעינת השאלונים');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [userId]);

  // קישור ציבורי (מוחלט)
  const publicUrl = useMemo(() => {
    if (!current) return '';
    const built = buildDistributeUrl(current.public_token, { lang, partnerId: ref, channel: null });
    announce('הקישור עודכן');
    return built;
  }, [current, lang, ref]);

  // תבנית שיתוף אחידה
  const shareText = useMemo(() => {
    return `${current?.title ?? 'שאלון'} – נשמח לפרט, מלא/י: ${publicUrl}`;
  }, [current?.title, publicUrl]);

  function resolveQid(): string | null {
    if (current?.id) return current.id;
    // @ts-ignore
    if (typeof qid === "string" && qid) return qid;
    // @ts-ignore
    if (typeof selectedQuestionnaireId === "string" && selectedQuestionnaireId) return selectedQuestionnaireId;
    // @ts-ignore
    if (typeof questionnaireId === "string" && questionnaireId) return questionnaireId;
    try {
      // @ts-ignore
      const params = useParams?.();
      // id / qid תמיכה בשני שמות
      // @ts-ignore
      return params?.id || params?.qid || null;
    } catch { return null; }
  }
  
  async function handleGenerateLinks() {
    try {
      const qid = resolveQid();
      if (!qid) { safeToast({ title: "לא נבחר שאלון", description: "בחרי שאלון להפצה" }); return; }
  
      // פרסום אוטומטי (idempotent) – כי כל ה־questionnaires אצלך is_published=false
      const pub = await rpcPublishQuestionnaire(qid);
      if (pub?.token) setCurrentToken(pub.token);
  
      const links = await rpcGetDistributionLinks(qid, getBaseUrl());
      setShareLinks(links);
      safeToast({ title: "הקישורים מוכנים", description: "הועמסו קישורי Web/WhatsApp/Mail" });
    } catch (e) {
      console.error(e);
      safeToast({ title: "שגיאה", description: "הפקת הקישורים נכשלה" });
    }
  }

  // פעולות
  const onCopyClick = async () => {
    if (!publishState.is_published || !shareLinks?.web_url) {
      safeToast({ title: "לא פורסם", description: "יש לפרסם את השאלון לפני שניתן להעתיק קישור." });
      return;
    }
    try {
      const url = shareLinks?.web_url ??
        (currentToken ? new URL(`/q/${currentToken}?lang=he&ref=landing`, getBaseUrl()).toString() : "");
  
      if (!url) { safeToast({ title: "אין קישור", description: "לחצי קודם על הפקה" }); return; }
  
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement("textarea");
        ta.value = url; 
        document.body.appendChild(ta); 
        ta.focus();
        ta.select();
        try {
          document.execCommand("copy");
        } catch (err) {
          console.error('Fallback copy failed', err);
        }
        document.body.removeChild(ta);
      }
      safeToast({ title: "הועתק", description: "הקישור הועתק ללוח" });
    } catch (e) {
      console.error(e);
      safeToast({ title: "שגיאה", description: "העתקה נכשלה" });
    }
  };

  const handleWhatsApp = async () => {
    if (!current || !publicUrl) return;
    openShare("whatsapp", publicUrl);
  };

  const handleFacebook = () => {
    if (!publicUrl) return;
    openShare("facebook", publicUrl);
  };

  const handleInstagram = async () => {
    if (!publicUrl) return;
    openShare("instagram", publicUrl);
  };

  const handleLinkedin = () => {
    if (!publicUrl) return;
    openShare("linkedin", publicUrl);
  };

  const handleTwitter = () => {
    if (!publicUrl) return;
    const text = `${current?.title ?? 'שאלון'} – נשמח לפרט`;
    const href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(publicUrl)}`;
    window.open(href, '_blank', 'noopener,noreferrer,width=600,height=400');
  };

  // email providers
  type EmailProvider = 'default' | 'gmail' | 'outlook';
  const openEmailProvider = (provider: EmailProvider) => {
    if (!current || !publicUrl) return;
    const subject = encodeURIComponent(current.title || 'Questionnaire');
    const body = encodeURIComponent(shareText);
    if (provider === 'gmail') {
      const url = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (provider === 'outlook') {
      const url = `https://outlook.live.com/mail/0/deeplink/compose?subject=${subject}&body=${body}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    const href = `mailto:?subject=${subject}&body=${body}`;
    window.location.href = href;
  };

  const handleEmail = () => {
    if (!publicUrl) return;
    openShare("email", publicUrl);
  };

  const handlePreview = () => {
    if (!publicUrl) return;
    window.open(publicUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSaveQr = async () => {
    try {
      if (!publicUrl) return;
      const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(publicUrl)}`;
      const res = await fetch(qrApi);
      if (!res.ok) throw new Error('bad response');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'questionnaire_qr.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('QR נשמר/הורד');
    } catch {
      toast.error('נכשל ליצור QR', { description: 'נסי שוב' });
    }
  };

  const handleEdit = () => {
    if (!current) return;
    navigate(buildEditUrl(current.id));
  };

  // החלפת שאלון מהקומבו – מעדכן URL param ושומר מצב, ומוודא קיום token דרך RPC אם חסר
  const handleSelect = async (id: string) => {
    const next = list.find((x) => x.id === id) ?? null;
    if (!next) {
      setCurrent(null);
      const usp = new URLSearchParams(searchParams);
      usp.delete('token');
      setSearchParams(usp, { replace: true });
      return;
    }

    let ensuredToken = next.public_token;
    if (!ensuredToken) {
      try {
        const { data, error } = await supabase.rpc('ensure_questionnaire_token', { qid: id });
        if (!error && data) {
          ensuredToken = String(data);
        }
      } catch {}
    }

    const updated: QMin = { id: next.id, title: next.title, public_token: ensuredToken } as QMin;
    setCurrent(updated);
    
    // Check publish state
    const state = await getPublishState(id);
    if (state) {
      setPublishState(state);
    }

    // Auto-generate links on select
    handleGenerateLinks();

    const usp = new URLSearchParams(searchParams);
    if (ensuredToken) usp.set('token', ensuredToken); else usp.delete('token');
    setSearchParams(usp, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto p-4 sm:p-6 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Share2 className="w-8 h-8" />
            הפצה
          </h1>
          <p className="text-muted-foreground">ניהול קישורי הפצה, שיתוף ברשתות חברתיות ותצוגה מקדימה – במקום אחד.</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              הגדרות בסיסיות
            </CardTitle>
            <CardDescription>בחר שאלון והגדר את פרמטרי השיתוף</CardDescription>
          </CardHeader>
          <CardContent>
            {/* בחירת שאלון */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="qsel">שאלון</label>
                <select
                  id="qsel"
                  aria-label="בחירת שאלון"
                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={current?.id ?? ''}
                  onChange={(e) => handleSelect(e.target.value)}
                  disabled={loading || list.length === 0}
                >
                  {list.map((q) => (
                    <option key={q.id} value={q.id}>{q.title || q.id}</option>
                  ))}
                </select>
                {inlineMsg && (
                  <div className="mt-1 text-xs text-destructive">{inlineMsg}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="ref">מקור תנועה</label>
                <input
                  id="ref"
                  aria-label="מקור תנועה"
                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="landing / campaign / partner-code…"
                  value={ref}
                  onChange={(e) => setRef(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="lang">שפה</label>
                <select
                  id="lang"
                  aria-label="שפה"
                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={lang}
                  onChange={(e) => setLang(e.target.value as Lang)}
                >
                  <option value="he">עברית</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            {/* קישור מוכן */}
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">קישור להפצה</label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shareLinks?.web_url || publicUrl}
                  aria-label="קישור להפצה"
                  className="flex-1 px-3 py-2 bg-muted border border-border rounded-md text-sm font-mono"
                />
                {!publishState.is_published && current && (
                  <Button onClick={() => publishThen(current.id, handleGenerateLinks)} variant="secondary" size="sm">
                    <Zap className="w-4 h-4 ml-1" />
                    פרסום
                  </Button>
                )}
                <Button onClick={onCopyClick} disabled={!current || !publishState.is_published} variant="outline" size="sm">
                  <Copy className="w-4 h-4 ml-1" />
                  העתק
                </Button>
                <Button onClick={() => previewAny(current?.id || '', lang, 'preview')} disabled={!current} variant="outline" size="sm">
                  <Eye className="w-4 h-4 ml-1" />
                  תצוגה מקדימה
                </Button>
              </div>
              <div className="text-xs text-muted-foreground mt-1">הקישור מתעדכן אוטומטית לפי הבחירות שלך</div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="share" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="share" className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              שיתוף ברשתות
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              אימייל
            </TabsTrigger>
            <TabsTrigger value="qr" className="flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              QR קוד
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              כלים
            </TabsTrigger>
          </TabsList>

          {/* לשונית שיתוף ברשתות חברתיות */}
          <TabsContent value="share" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>שיתוף ברשתות חברתיות</CardTitle>
                <CardDescription>שתף את השאלון ברשתות החברתיות הפופולריות</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Button
                    onClick={handleWhatsApp}
                    disabled={!current}
                    className="flex flex-col items-center p-6 h-auto bg-[#25D366] hover:bg-[#128C7E] text-white"
                  >
                    <MessageCircle className="w-8 h-8 mb-2" />
                    <span>WhatsApp</span>
                  </Button>

                  <Button
                    onClick={handleFacebook}
                    disabled={!publicUrl}
                    className="flex flex-col items-center p-6 h-auto bg-[#1877F2] hover:bg-[#166FE5] text-white"
                  >
                    <Facebook className="w-8 h-8 mb-2" />
                    <span>Facebook</span>
                  </Button>

                  <Button
                    onClick={handleLinkedin}
                    disabled={!publicUrl}
                    className="flex flex-col items-center p-6 h-auto bg-[#0A66C2] hover:bg-[#004182] text-white"
                  >
                    <Linkedin className="w-8 h-8 mb-2" />
                    <span>LinkedIn</span>
                  </Button>

                  <Button
                    onClick={handleInstagram}
                    disabled={!publicUrl}
                    className="flex flex-col items-center p-6 h-auto bg-gradient-to-r from-[#E4405F] to-[#F77737] hover:from-[#D73447] hover:to-[#F56500] text-white"
                  >
                    <Instagram className="w-8 h-8 mb-2" />
                    <span>Instagram</span>
                  </Button>
                </div>

                <div className="mt-4 text-sm text-muted-foreground">
                  <p>💡 <strong>טיפ:</strong> Instagram - הקישור יועתק ותוכל להדביק אותו ב-Stories או בביו</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* לשונית אימייל */}
          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>שיתוף באימייל</CardTitle>
                <CardDescription>שלח את השאלון באימייל או העתק תבנית מוכנה</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Button
                    onClick={() => openEmailProvider('gmail')}
                    disabled={!current}
                    variant="outline"
                    className="flex flex-col items-center p-6 h-auto"
                  >
                    <Mail className="w-8 h-8 mb-2 text-[#EA4335]" />
                    <span>Gmail</span>
                  </Button>

                  <Button
                    onClick={() => openEmailProvider('outlook')}
                    disabled={!current}
                    variant="outline"
                    className="flex flex-col items-center p-6 h-auto"
                  >
                    <Mail className="w-8 h-8 mb-2 text-[#0078D4]" />
                    <span>Outlook</span>
                  </Button>

                  <Button
                    onClick={() => openEmailProvider('default')}
                    disabled={!current}
                    variant="outline"
                    className="flex flex-col items-center p-6 h-auto"
                  >
                    <Mail className="w-8 h-8 mb-2" />
                    <span>אימייל כללי</span>
                  </Button>
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">תבנית אימייל מוכנה:</h4>
                  <div className="text-sm text-muted-foreground bg-background p-3 rounded border font-mono">
                    {shareText}
                  </div>
                  <Button
                    onClick={() => navigator.clipboard.writeText(shareText)}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    <Copy className="w-4 h-4 ml-1" />
                    העתק תבנית
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* לשונית QR קוד */}
          <TabsContent value="qr" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>QR קוד</CardTitle>
                <CardDescription>צור וצפה בקוד QR לשאלון שלך</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="p-4 bg-white rounded-lg border">
                        <img
                          alt="QR קוד לשאלון"
                          className="w-64 h-64"
                          src={publicUrl ? buildQrApiUrl(publicUrl, 512) : ''}
                        />
                      </div>
                    </div>

                    <div className="flex justify-center gap-2">
                      <Button
                        onClick={handleSaveQr}
                        disabled={!publicUrl}
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        הורד QR
                      </Button>
                      <Button
                        onClick={handlePreview}
                        disabled={!publicUrl}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        תצוגה מקדימה
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">איך להשתמש בקוד QR:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• הורד את הקוד והדפס אותו</li>
                        <li>• שתף ברשתות חברתיות</li>
                        <li>• הוסף לחומרי שיווק</li>
                        <li>• שלח בווטסאפ או אימייל</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-muted rounded-lg">
                      <h5 className="font-medium mb-2">💡 טיפים מקצועיים:</h5>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• הוסף טקסט הסבר מתחת לקוד</li>
                        <li>• השתמש ברקע לבן לסריקה טובה יותר</li>
                        <li>• בדוק שהקוד סריק לפני הדפסה</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* לשונית כלים */}
          <TabsContent value="tools" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="w-5 h-5" />
                    עריכה וניהול
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={handleEdit}
                    disabled={!current}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Edit className="w-4 h-4 ml-2" />
                    ערוך את השאלון
                  </Button>

                  <Button
                    onClick={handlePreview}
                    disabled={!publicUrl}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Eye className="w-4 h-4 ml-2" />
                    תצוגה מקדימה
                  </Button>

                  <Button
                    onClick={onCopyClick}
                    disabled={!current}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Copy className="w-4 h-4 ml-2" />
                    העתק קישור מהיר
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    מידע ותובנות
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {current && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">שם השאלון:</span>
                        <span className="font-medium">{current.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">טוקן:</span>
                        <Badge variant="outline" className="font-mono text-xs">
                          {current.public_token}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">מקור תנועה:</span>
                        <Badge variant="secondary">{ref || 'ללא'}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">שפה:</span>
                        <Badge variant="secondary">{lang === 'he' ? 'עברית' : 'English'}</Badge>
                      </div>
                    </div>
                  )}

                  {!current && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      בחר שאלון כדי לראות פרטים
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* שיתוף מתקדם */}
            {publicUrl && (
              <Card>
                <CardHeader>
                  <CardTitle>שיתוף מתקדם</CardTitle>
                  <CardDescription>אפשרויות שיתוף נוספות ומותאמות אישית</CardDescription>
                </CardHeader>
                <CardContent>
                  <AdvancedShare
                    link={publicUrl}
                    subject={current?.title || 'שאלון'}
                    message={'נשמח אם תמלא/י את השאלון'}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* דיאלוג שיתוף */}
        <ShareDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          url={publicUrl}
          title={current?.title ?? 'שאלון'}
          subject={current?.title ?? 'שאלון'}
          body={current ? 'נשמח לפרט, מלא/י את השאלון' : undefined}
          whatsappTemplate={'היי! מוזמן/ת למלא: {link}'}
        />
      </div>
    </div>
  );
}
