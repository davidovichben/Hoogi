import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { buildPublicUrl } from '@/lib/publicUrl';

type Q = {
  id: string;
  token: string;
  title: string | null;
  default_lang?: 'he' | 'en' | null;
};

type Partner = { id: string; name: string; code: string };

const LANGS: Array<{label: string; value: 'he'|'en'}> = [
  { label: 'Hebrew', value: 'he' },
  { label: 'English', value: 'en' },
];

const REFS = [
  { label: 'landing', value: 'landing' },
  { label: 'whatsapp', value: 'whatsapp' },
  { label: 'mail', value: 'mail' },
  { label: 'qr', value: 'qr' },
  { label: 'other', value: 'other' },
];

export default function DistributionHub() {
  const [sp] = useSearchParams();
  const token = sp.get('token') ?? '';
  const [q, setQ] = useState<Q|null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<'he'|'en'>('he');
  const [ref, setRef]   = useState<string>('landing');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [partnerCode, setPartnerCode] = useState<string>('');

  // load questionnaire by token
  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('questionnaires')
        .select('id, token, title, default_lang')
        .eq('token', token)
        .single();
      if (!ignore) {
        if (error) console.error('Failed to fetch questionnaire:', error);
        setQ(data ?? null);
        if (data?.default_lang && (data.default_lang === 'he' || data.default_lang === 'en')) {
          setLang(data.default_lang);
        }
        setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [token]);

  // load partners (optional)
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('partners')
        .select('id, name, code')
        .order('name');
      setPartners(data ?? []);
    })();
  }, []);

  // final ref (UI selector OR partner code)
  const effectiveRef = partnerCode?.trim() ? partnerCode.trim() : ref;

  const shareUrl = useMemo(() => {
    if (!q?.token) return '';
    return buildPublicUrl({ token: q.token, lang, ref: effectiveRef });
  }, [q?.token, lang, effectiveRef]);

  // helpers
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('קישור הועתק ✔');
    } catch {
      prompt('העתיקו ידנית:', text);
    }
  };

  const mailtoHref = useMemo(() => {
    const subject = encodeURIComponent(q?.title ? `שאלון: ${q.title}` : 'שאלון');
    const body    = encodeURIComponent(`אשמח שתענו: ${shareUrl}`);
    return `mailto:?subject=${subject}&body=${body}`;
  }, [q?.title, shareUrl]);

  const whatsappHref = useMemo(() => {
    const text = encodeURIComponent(`אשמח שתענו: ${shareUrl}`);
    return `https://wa.me/?text=${text}`;
  }, [shareUrl]);

  if (!token) {
    return (
      <div className="p-6" dir="rtl">
        <div className="text-2xl font-bold mb-2">הפצה</div>
        <div className="text-muted-foreground">חסרה פרמטר token ב־URL. חזרי למסך השאלונים ובחרי "הפצה".</div>
        <Link to="/questionnaires" className="underline text-primary mt-4 inline-block">למסך השאלונים</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto p-4 sm:p-6 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">הפצה</h1>
          <p className="text-muted-foreground">
            יצירת קישורי הפצה לשאלון + שיתוף מהיר
          </p>
        </div>

        {/* Controls */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="text-sm text-muted-foreground">
            שאלון: <span className="font-medium text-foreground">{q?.title ?? (loading ? 'טוען…' : '—')}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">שפה</label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as 'he'|'en')}
                className="w-full px-2 py-1 text-sm bg-background border border-border rounded-md"
              >
                {LANGS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Ref</label>
              <select
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                className="w-full px-2 py-1 text-sm bg-background border border-border rounded-md"
                disabled={!!partnerCode}
              >
                {REFS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <div className="text-[11px] text-muted-foreground mt-1">אפשר לבחור כאן או להזין קוד שותף</div>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">קוד שותף (אופציונלי)</label>
              <input
                list="partners-list"
                value={partnerCode}
                onChange={(e) => setPartnerCode(e.target.value)}
                placeholder="ex: prtnr123"
                className="w-full px-2 py-1 text-sm bg-background border border-border rounded-md"
              />
              <datalist id="partners-list">
                {partners.map(p => <option key={p.id} value={p.code}>{p.name}</option>)}
              </datalist>
            </div>
          </div>
        </div>

        {/* Preview + Share */}
        <div className="bg-card border border-border rounded-lg p-4 mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => copy(shareUrl)}
              className="px-4 py-2 rounded-md bg-muted hover:bg-muted/80"
              disabled={!shareUrl}
            >
              העתק קישור
            </button>

            <a
              href={mailtoHref}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-center"
              onClick={() => {/* future: log share */}}
            >
              שיתוף באימייל
            </a>

            <a
              href={whatsappHref}
              target="_blank" rel="noreferrer"
              className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 text-center"
              onClick={() => {/* future: log share */}}
            >
              שיתוף ב־WhatsApp
            </a>
          </div>

          {/* Link line */}
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-sm"
            />
            <button
              onClick={() => window.open(shareUrl, '_blank')}
              className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90"
              disabled={!shareUrl}
            >
              תצוגה מקדימה
            </button>

            {q?.id && (
              <Link
                to={`/questionnaires/${q.id}/review`}
                className="px-4 py-2 rounded-md bg-muted hover:bg-muted/80"
              >
                עריכת השאלון
              </Link>
            )}
          </div>

          {/* QR */}
          <div className="mt-2">
            <label className="block text-xs text-muted-foreground mb-2">קוד QR</label>
            <img
              alt="QR"
              src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(shareUrl)}`}
              className="w-[220px] h-[220px] border border-border rounded-md"
            />
          </div>
        </div>

        {/* Automations placeholder */}
        <div className="bg-card border border-border rounded-lg p-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">אוטומציות (בקרוב)</div>
              <div className="text-sm text-muted-foreground">הפעלת מענה אוטומטי/שליחת מיילים על תגובה חדשה.</div>
            </div>
            <button
              disabled
              className="px-4 py-2 rounded-md bg-muted text-muted-foreground cursor-not-allowed"
              title="יגיע בשלב הבא"
            >
              נהל אוטומציות
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
