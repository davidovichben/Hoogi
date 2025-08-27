import React from 'react';
import { toast } from '@/components/ui/Toaster';

function enc(s: string) { return encodeURIComponent(s); }

function buildMailto(to: string | undefined, subject: string, body: string) {
  const base = `mailto:${to ?? ''}`;
  const qp = `?subject=${enc(subject)}&body=${enc(body)}`;
  return base + qp;
}

function buildGmail(subject: string, body: string, to?: string) {
  const u = new URL('https://mail.google.com/mail/');
  u.searchParams.set('view', 'cm');
  if (to) u.searchParams.set('to', to);
  u.searchParams.set('su', subject);
  u.searchParams.set('body', body);
  return u.toString();
}

function buildOutlook(subject: string, body: string, to?: string) {
  const u = new URL('https://outlook.live.com/mail/0/deeplink/compose');
  if (to) u.searchParams.set('to', to);
  u.searchParams.set('subject', subject);
  u.searchParams.set('body', body);
  return u.toString();
}

function buildWhatsApp(text: string) {
  return `https://wa.me/?text=${enc(text)}`;
}

export type AdvancedShareProps = {
  link: string;
  subject?: string;
  message?: string;
  toEmail?: string;
  className?: string;
};

export const AdvancedShare: React.FC<AdvancedShareProps> = ({
  link, subject = 'שאלון חדש לשיתוף', message = 'שלום! מצרף קישור לשאלון:', toEmail, className
}) => {
  const fullText = `${message}\n\n${link}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      toast.success('הקישור הועתק ✨');
    } catch {
      toast.error('לא הצלחתי להעתיק', { description: 'נסו להעתיק ידנית' });
    }
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: subject, text: message, url: link });
        toast.info('שיתוף נשלח');
      } catch {
        // בוטל ע"י המשתמש – אין צורך להתריע
      }
    } else {
      await copyLink();
    }
  }

  return (
    <div className={className} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', direction: 'rtl' }}>
      <button onClick={copyLink} aria-label="העתק קישור" title="העתק קישור"
        style={btnStyle('#fff', '#222')}>העתק קישור</button>

      <button onClick={nativeShare} aria-label="שיתוף מהיר" title="שיתוף מהיר"
        style={btnStyle('#18a0fb', '#fff')}>שיתוף מהיר</button>

      <a href={buildWhatsApp(fullText)} target="_blank" rel="noreferrer"
        aria-label="שיתוף בוואטסאפ" title="שיתוף בוואטסאפ"
        style={linkBtn('#25d366', '#fff')}>WhatsApp</a>

      <a href={buildGmail(subject, fullText, toEmail)} target="_blank" rel="noreferrer"
        aria-label="שליחה דרך Gmail" title="שליחה דרך Gmail"
        style={linkBtn('#d93025', '#fff')}>Gmail</a>

      <a href={buildOutlook(subject, fullText, toEmail)} target="_blank" rel="noreferrer"
        aria-label="שליחה דרך Outlook" title="שליחה דרך Outlook"
        style={linkBtn('#0f6cbd', '#fff')}>Outlook</a>

      <a href={buildMailto(toEmail, subject, fullText)}
        aria-label="שליחה עם לקוח המייל שלי" title="שליחה עם לקוח המייל שלי"
        style={linkBtn('#ffb703', '#111')}>mailto</a>
    </div>
  );
};

function btnStyle(bg: string, fg: string): React.CSSProperties {
  return {
    background: bg, color: fg, border: '1px solid rgba(0,0,0,.1)', borderRadius: 10,
    padding: '10px 14px', cursor: 'pointer', fontWeight: 600
  };
}

function linkBtn(bg: string, fg: string): React.CSSProperties {
  return { ...btnStyle(bg, fg), textDecoration: 'none', display: 'inline-block' };
}

export default AdvancedShare;


