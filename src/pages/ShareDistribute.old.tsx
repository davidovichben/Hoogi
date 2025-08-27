import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '../components/ui/Toast';
import QRCode from 'qrcode';

type QRow = {
  id: string;
  title?: string | null;
  slug?: string | null;
  status?: string | null;
  public_token?: string | null;
  is_published?: boolean | null;
};

const brand = {
  primary: '#16939B',
  secondary: '#FFD500',
  text: '#0F172A',
  logoUrl: ''
};

function buildPublicUrl(origin: string, q: QRow) {
  const base = origin || window.location.origin;
  // נשתמש ב-slug אם קיים, אחרת ב-id
  const identifier = q.slug && q.slug.trim() ? q.slug : q.id;
  return `${base.replace(/\/$/, '')}/q/${encodeURIComponent(identifier)}`;
}

export default function ShareDistribute() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { Toast, setMsg } = useToast();
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState<QRow | null>(null);
  const [origin, setOrigin] = useState<string>(typeof window !== 'undefined' ? window.location.origin : '');
  const [variantName, setVariantName] = useState<string>('ברירת מחדל');
  const [waText, setWaText] = useState<string>('היי! אשמח לקבל את תשובותיך בקישור לשאלון:');
  const [emailSubject, setEmailSubject] = useState<string>('שאלון קצר עבורכם');
  const [emailBody, setEmailBody] = useState<string>('שלום,\nאשמח למענה קצר על השאלון בקישור:\n');
  const publicUrl = useMemo(() => (q ? buildPublicUrl(origin, q) : ''), [origin, q]);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    (async () => {
      if (!id) { setLoading(false); return; }
             const { data, error } = await supabase
         .from('questionnaires')
         .select('id,title,slug,status,public_token,is_published')
         .eq('id', id)
         .single();
      if (error) {
        console.error(error);
        setMsg('שגיאה בטעינת השאלון');
      } else {
        setQ(data as QRow);
      }
      setLoading(false);
    })();
  }, [id, setMsg]);

  useEffect(() => {
    if (!publicUrl) return;
    QRCode.toDataURL(publicUrl, { margin: 1, width: 240 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));
  }, [publicUrl]);

  if (loading) return <div className="p-6">טוען…</div>;
  if (!q) return <div className="p-6">לא נמצא שאלון</div>;

  const doCopy = async (text: string, okMsg = 'הועתק ✅') => {
    try {
      await navigator.clipboard.writeText(text);
      setMsg(okMsg);
    } catch {
      setMsg('שגיאה בהעתקה');
    }
  };

  const onCopyAll = () => {
    const all = [
      `🔗 לינק: ${publicUrl}`,
      `📱 וואטסאפ: https://wa.me/?text=${encodeURIComponent(waText + ' ' + publicUrl)}`,
      `✉️ מייל: mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody + '\n' + publicUrl)}`,
      `🧩 Embed:\n<iframe src="${publicUrl}" style="width:100%;max-width:640px;height:900px;border:0;border-radius:16px"></iframe>`
    ].join('\n');
    doCopy(all, 'כל הפרטים הועתקו ✅');
  };

  const openWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(waText + ' ' + publicUrl)}`;
    window.open(url, '_blank');
  };

  const openMailto = () => {
    const url = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody + '\n' + publicUrl)}`;
    window.location.href = url;
  };

  const onFinishAndSave = async () => {
    try {
      const { error } = await supabase
        .from('questionnaires')
        .update({ status: 'ready_to_share' as any, variant_name: variantName as any })
        .eq('id', q!.id);
      if (error) console.warn('Update warning:', error.message);
      setMsg('נשמר והוכן להפצה ✅');
      setTimeout(() => navigate(`/questionnaires/${q!.id}`), 700);
    } catch {
      setMsg('נשמר (ללא שינוי סטטוס — אין שדה כזה)');
      setTimeout(() => navigate(`/questionnaires/${q!.id}`), 700);
    }
  };

  return (
    <div className="p-6 space-y-8" dir="rtl">
      <Toast />
      <div className="flex items-center gap-3">
        {brand.logoUrl ? <img src={brand.logoUrl} alt="logo" className="w-10 h-10 rounded-lg" /> : null}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: brand.text }}>הפצה ושיתוף</h1>
          <p className="text-sm opacity-70">זהו השלב האחרון לפני פרסום. בחרי ערוצי הפצה והתאמות מהירות.</p>
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">שם גרסה להפצה (אופציונלי)</label>
        <input 
          value={variantName} 
          onChange={e => setVariantName(e.target.value)}
          className="border rounded-xl px-3 py-2" 
          placeholder="למשל: קמפיין וואטסאפ – ספטמבר" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border p-4 space-y-3">
          <div className="font-semibold">לינק ישיר</div>
          <input readOnly value={publicUrl} className="border rounded-xl px-3 py-2 w-full" />
          <div className="flex gap-2">
            <button onClick={() => doCopy(publicUrl)} className="px-3 py-2 rounded-xl border">העתק קישור</button>
            <a href={publicUrl} target="_blank" className="px-3 py-2 rounded-xl border">תצוגה</a>
          </div>
        </div>

        <div className="rounded-2xl border p-4 space-y-3">
          <div className="font-semibold">WhatsApp</div>
          <textarea 
            value={waText} 
            onChange={e => setWaText(e.target.value)} 
            className="border rounded-xl px-3 py-2 w-full h-20" 
          />
          <div className="flex gap-2">
            <button onClick={openWhatsApp} className="px-3 py-2 rounded-xl border" style={{ borderColor: '#25D366' }}>
              שליחה בוואטסאפ
            </button>
            <button onClick={() => doCopy(`https://wa.me/?text=${encodeURIComponent(waText + ' ' + publicUrl)}`)} className="px-3 py-2 rounded-xl border">
              העתק לינק וואטסאפ
            </button>
          </div>
        </div>

        <div className="rounded-2xl border p-4 space-y-3">
          <div className="font-semibold">Email</div>
          <input 
            value={emailSubject} 
            onChange={e => setEmailSubject(e.target.value)} 
            className="border rounded-xl px-3 py-2 w-full" 
            placeholder="נושא" 
          />
          <textarea 
            value={emailBody} 
            onChange={e => setEmailBody(e.target.value)} 
            className="border rounded-xl px-3 py-2 w-full h-20" 
            placeholder="תוכן ההודעה" 
          />
          <div className="flex gap-2">
            <button onClick={openMailto} className="px-3 py-2 rounded-xl border">פתח מייל</button>
            <button onClick={() => doCopy(`mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody + '\n' + publicUrl)}`)} className="px-3 py-2 rounded-xl border">
              העתק mailto
            </button>
          </div>
        </div>

        <div className="rounded-2xl border p-4 space-y-3">
          <div className="font-semibold">Embed באתר</div>
          <textarea 
            readOnly 
            className="border rounded-xl px-3 py-2 w-full h-24"
            value={`<iframe src="${publicUrl}" style="width:100%;max-width:640px;height:900px;border:0;border-radius:16px"></iframe>`} 
          />
          <div className="flex gap-2">
            <button onClick={() => doCopy(`<iframe src="${publicUrl}" style="width:100%;max-width:640px;height:900px;border:0;border-radius:16px"></iframe>`)} className="px-3 py-2 rounded-xl border">
              העתק קוד הטמעה
            </button>
            <a href={publicUrl} target="_blank" className="px-3 py-2 rounded-xl border">תצוגה</a>
          </div>
        </div>

        <div className="rounded-2xl border p-4 space-y-3">
          <div className="font-semibold">QR Code</div>
          {qrDataUrl ? <img src={qrDataUrl} alt="QR" className="w-40 h-40" /> : <div>יוצר QR…</div>}
          <div className="flex gap-2">
            <button onClick={() => doCopy(publicUrl)} className="px-3 py-2 rounded-xl border">העתק קישור</button>
            {qrDataUrl ? <a download="questionnaire-qr.png" href={qrDataUrl} className="px-3 py-2 rounded-xl border">הורד QR</a> : null}
          </div>
        </div>

        <div className="rounded-2xl border p-4 space-y-3">
          <div className="font-semibold">כללי</div>
          <button onClick={onCopyAll} className="px-3 py-2 rounded-xl border w-full">העתק הכול</button>
          <button
            onClick={() => {
              supabase.auth.getUser().then(({ data }) => {
                const email = data.user?.email;
                if (email) {
                  const url = `mailto:${email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody + '\n' + publicUrl)}`;
                  window.location.href = url;
                } else {
                  doCopy(publicUrl, 'קישור הועתק (אין אימייל משתמש)');
                }
              });
            }}
            className="px-3 py-2 rounded-xl border w-full"
          >
            שלח לעצמי לבדיקה
          </button>
          <div className="text-sm opacity-70 space-y-1">
            <div>💡 טיפים להפצה:</div>
            <ul className="list-disc ps-5">
              <li>כיתוב קצר וברור ליד הקישור מעלה המרות.</li>
              <li>בוואטסאפ – הוסיפי שורה אישית ראשונה.</li>
              <li>באתר – עדיף הטמעה ברוחב 100% ומסגרת מעוגלת.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <Link to={`/onboarding`} className="px-4 py-2 rounded-xl border">חזור לעיצוב</Link>
        <div className="flex gap-3">
          <button onClick={onFinishAndSave} className="px-5 py-2 rounded-xl" style={{ backgroundColor: brand.primary, color: 'white' }}>
            סיים ושמור להפצה
          </button>
        </div>
      </div>
    </div>
  );
}


