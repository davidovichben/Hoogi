import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { buildPublicUrl } from '../lib/publicUrl';

// אם אין את הספרייה, התקיני פעם אחת:  npm i qrcode
import QRCode from 'qrcode';

type Questionnaire = {
  id: string;
  title: string | null;
  token: string;
  default_lang?: 'he' | 'en' | null;
};

const DistributionHub: React.FC = () => {
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();

  const token = sp.get('token') || '';
  const [q, setQ] = useState<Questionnaire | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const [lang, setLang] = useState<'he' | 'en'>('he');
  const [ref, setRef] = useState('landing');
  const [qr, setQr] = useState<string>('');

  const publicUrl = useMemo(
    () => (q ? buildPublicUrl({ token: q.token, lang, ref }) : ''),
    [q, lang, ref]
  );

  // טעינת שאלון לפי token מה-URL
  useEffect(() => {
    const load = async () => {
      setErr(null);
      setLoading(true);
      try {
        if (!token) {
          // אין token: לא נטען כלום - נציג את הרשימה
          setQ(null);
          setLoading(false);
          return;
        }
        const { data, error } = await supabase
          .from('questionnaires')
          .select('id,title,token,default_lang')
          .eq('token', token)
          .single();

        if (error) throw error;
        if (!data) throw new Error('שאלון לא נמצא');

        setQ(data);
        setLang((data.default_lang as 'he' | 'en') || 'he');
      } catch (e: any) {
        console.error('Failed to fetch questionnaire:', e);
        setErr(e?.message || 'שגיאה בטעינת השאלון');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  // טעינת רשימת שאלונים
  useEffect(() => {
    const loadQuestionnaires = async () => {
      if (q) return; // אם יש שאלון נבחר, לא נטען רשימה
      setLoadingList(true);
      try {
        const { data, error } = await supabase
          .from('questionnaires')
          .select('id,title,token,default_lang')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setQuestionnaires(data || []);
      } catch (e: any) {
        console.error('Failed to fetch questionnaires:', e);
      } finally {
        setLoadingList(false);
      }
    };
    loadQuestionnaires();
  }, [q]);

  // בניית QR בכל שינוי קישור
  useEffect(() => {
    const makeQR = async () => {
      if (!publicUrl) return setQr('');
      try {
        const dataUrl = await QRCode.toDataURL(publicUrl, { width: 512, margin: 1 });
        setQr(dataUrl);
      } catch {
        setQr('');
      }
    };
    makeQR();
  }, [publicUrl]);

  const copyLink = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    alert('הקישור הועתק ✅');
    // לוג שיתוף — לא חובה, עטוף ב-try/catch אם אין טבלה
    try {
      await supabase.from('share_logs').insert({
        questionnaire_id: q?.id,
        token: q?.token,
        channel: 'copy',
        lang,
        ref,
      });
    } catch {/* ignore */}
  };

  const shareWhatsApp = () => {
    if (!publicUrl) return;
    const text = encodeURIComponent(`אשמח לקבל את תשובתך\n${publicUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
    try {
      supabase.from('share_logs').insert({ questionnaire_id: q?.id, token: q?.token, channel: 'whatsapp', lang, ref });
    } catch {/* ignore */}
  };

  const shareMail = () => {
    if (!publicUrl) return;
    const subject = encodeURIComponent(q?.title || 'אשמח לתשובתך');
    const body = encodeURIComponent(`היי,\nאשמח שתענו על השאלון:\n${publicUrl}\nתודה!`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    try {
      supabase.from('share_logs').insert({ questionnaire_id: q?.id, token: q?.token, channel: 'mail', lang, ref });
    } catch {/* ignore */}
  };

  const openPreview = () => {
    if (!publicUrl) return;
    window.open(publicUrl, '_blank', 'noopener,noreferrer');
  };

  const pickAnother = () => navigate('/questionnaires');

  if (loading) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <div className="container mx-auto p-4 sm:p-6">
          <div className="h-10 w-48 bg-muted rounded animate-pulse mb-4" />
          <div className="h-24 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <div className="container mx-auto p-4 sm:p-6">
          <h1 className="text-2xl font-bold mb-2">שגיאה בטעינת השאלון</h1>
          <div className="text-destructive">{err}</div>
          <button onClick={pickAnother} className="mt-4 px-4 py-2 rounded bg-primary text-primary-foreground">חזרה לשאלונים</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">הפצה</h1>
          <p className="text-muted-foreground">יצירת קישורי הפצה לשאלון + שיתוף מהיר</p>
        </div>

        {/* רשימת שאלונים אם אין token נבחר */}
        {!q && !loading && (
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6 mb-6">
            <h3 className="text-lg font-medium mb-4">בחרי שאלון להפצה</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {loadingList ? (
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-muted-foreground">טוען שאלונים...</p>
                </div>
              ) : questionnaires.length > 0 ? (
                questionnaires.map((questionnaire) => (
                  <button
                    key={questionnaire.id}
                    onClick={() => {
                      const newParams = new URLSearchParams(sp);
                      newParams.set('token', questionnaire.token);
                      setSp(newParams);
                    }}
                    className="p-4 border rounded-lg text-right hover:bg-muted transition-colors"
                  >
                    <div className="font-medium">{questionnaire.title || 'ללא כותרת'}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {questionnaire.token.slice(0, 8)}...
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-muted-foreground">אין שאלונים להצגה</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Card */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
          {/* Row 1: Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs text-muted-foreground mb-1">שאלון</label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={q?.title || '—'}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md"
                />
                <button onClick={pickAnother} className="px-3 py-2 text-sm rounded-md border">בחרי אחר</button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">שפה</label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as 'he' | 'en')}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md"
              >
                <option value="he">Hebrew</option>
                <option value="en">English</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Ref</label>
              <input
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                placeholder="landing / campaign / demo…"
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md"
              />
            </div>
          </div>

          {/* Row 2: Actions */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={shareWhatsApp}
              className="px-4 py-3 rounded-md bg-emerald-600 text-white text-sm"
            >
              שיתוף ב־WhatsApp
            </button>
            <button
              onClick={shareMail}
              className="px-4 py-3 rounded-md bg-sky-600 text-white text-sm"
            >
              שיתוף באימייל
            </button>
            <button
              onClick={copyLink}
              className="px-3 py-3 rounded-md bg-muted text-foreground text-sm"
            >
              העתק קישור
            </button>
          </div>

          {/* Row 3: Link + Preview */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs text-muted-foreground mb-1">קישור להפצה</label>
              <input
                readOnly
                value={publicUrl}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md"
              />
            </div>
            <div className="flex items-end">
              <button onClick={openPreview} className="w-full px-4 py-2 rounded-md bg-primary text-primary-foreground">
                תצוגה מקדימה
              </button>
            </div>
          </div>

          {/* Row 4: QR */}
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2">קוד QR</h3>
            {qr ? (
              <img src={qr} alt="qr" className="w-40 h-40 border rounded" />
            ) : (
              <div className="w-40 h-40 bg-muted rounded animate-pulse" />
            )}
            <div className="text-xs text-muted-foreground mt-2">
              שמירה: לחיצה ימנית → Save image as…
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DistributionHub;
