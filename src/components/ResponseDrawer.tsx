import React from 'react';
import { toast } from '@/components/ui/Toaster';

type ResponseFlat = {
  response_id: string;
  submitted_at: string;
  lang: string | null;
  channel: string | null;
  answers: any;
  lead_id: string | null;
  lead_created_at: string | null;
  lead_name: string | null;
  lead_email: string | null;
  lead_phone: string | null;
  lead_phone_normalized?: string | null;
  lead_ref: string | null;
  questionnaire_id: string | null;
  questionnaire_title: string | null;
  status?: string | null;
  rating?: number | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  row: ResponseFlat | null;
  onExportOne?: (row: ResponseFlat) => void;
  onSaveMeta?: (status: string, rating: number | undefined) => Promise<void>;
  saving?: boolean;
};

const badge = (text: string, cls: string) => (
  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${cls}`}>
    {text}
  </span>
);

const langBadge = (lang: string | null) =>
  !lang ? <span className="text-muted-foreground">—</span> :
  lang === 'he' ? badge('Hebrew', 'bg-blue-100 text-blue-800') : badge('English', 'bg-green-100 text-green-800');

const channelBadge = (channel: string | null) => {
  const map: Record<string, string> = {
    landing: 'bg-purple-100 text-purple-800',
    whatsapp: 'bg-emerald-100 text-emerald-800',
    mail: 'bg-sky-100 text-sky-800',
    qr: 'bg-amber-100 text-amber-800',
    other: 'bg-zinc-200 text-zinc-800'
  };
  if (!channel) return <span className="text-muted-foreground">—</span>;
  return badge(channel, map[channel] ?? 'bg-zinc-200 text-zinc-800');
};

const formatDate = (iso?: string | null) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('he-IL');
  } catch {
    return '—';
  }
};

const ResponseDrawer: React.FC<Props> = ({ open, onClose, row, onExportOne, onSaveMeta, saving = false }) => {
  const [localStatus, setLocalStatus] = React.useState<string>(row?.status ?? 'new');
  const [localRating, setLocalRating] = React.useState<number | undefined>(row?.rating ?? undefined);
  
  // עדכון state כאשר row משתנה
  React.useEffect(() => {
    if (row) {
      setLocalStatus(row.status ?? 'new');
      setLocalRating(row.rating ?? undefined);
    }
  }, [row]);
  
  if (!open || !row) return null;

  const copyJson = async () => {
    try {
      const pretty = JSON.stringify(row.answers ?? {}, null, 2);
      await navigator.clipboard.writeText(pretty);
      toast.success('קובץ JSON הועתק');
    } catch {
      toast.error('לא ניתן להעתיק', { description: 'נסי ידנית' });
    }
  };

  const handleSave = async () => {
    if (onSaveMeta) {
      await onSaveMeta(localStatus, localRating);
    }
  };

  const entries = Object.entries((row.answers ?? {})).slice(0, 100); // הגבלה בטוחה

  return (
    <div className="fixed inset-0 z-50" dir="rtl" aria-modal role="dialog">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* panel */}
      <div className="absolute right-0 top-0 h-full w-full sm:max-w-[480px] bg-card border-l border-border shadow-xl flex flex-col">
        {/* header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold">פרטי תגובה</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground px-2 py-1 rounded">
            ✕
          </button>
        </div>

        {/* meta */}
        <div className="p-4 grid grid-cols-1 gap-2 text-sm">
          <div><span className="text-muted-foreground">תאריך: </span>{formatDate(row.submitted_at)}</div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">שפה:</span> {langBadge(row.lang)}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">ערוץ:</span> {channelBadge(row.channel)}
          </div>
          <div><span className="text-muted-foreground">שאלון: </span>{row.questionnaire_title || '—'}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div><span className="text-muted-foreground">שם: </span>{row.lead_name || '—'}</div>
            <div>
              <span className="text-muted-foreground">אימייל: </span>
              {row.lead_email ? <a className="text-primary underline" href={`mailto:${row.lead_email}`}>{row.lead_email}</a> : '—'}
            </div>
            <div>
              <span className="text-muted-foreground">טלפון: </span>
              {row.lead_phone ? <a className="text-primary underline" href={`tel:${row.lead_phone}`}>{row.lead_phone}</a> : '—'}
            </div>
            <div><span className="text-muted-foreground">Ref: </span>{row.lead_ref || '—'}</div>
          </div>
        </div>

        {/* Status and Rating Controls */}
        {onSaveMeta && (
          <div className="p-4 border-t border-border">
            <div className="mb-3 text-sm font-medium text-muted-foreground">ניהול תגובה</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">סטטוס</label>
                <select
                  value={localStatus}
                  onChange={(e) => setLocalStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  disabled={saving}
                >
                  <option value="new">חדש</option>
                  <option value="in-progress">בטיפול</option>
                  <option value="done">הושלם</option>
                  <option value="cancelled">בוטל</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">דירוג (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={localRating || ''}
                  onChange={(e) => setLocalRating(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="דירוג"
                  disabled={saving}
                />
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full mt-3 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'שומר...' : 'שמור שינויים'}
            </button>
          </div>
        )}

        {/* answers */}
        <div className="px-4 pb-4 flex-1 overflow-auto">
          <div className="mb-2 text-sm text-muted-foreground">תשובות</div>
          <div className="border border-border rounded-md divide-y">
            {entries.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground">אין תשובות להצגה</div>
            ) : entries.map(([k,v]) => (
              <div key={k} className="p-3 grid grid-cols-3 gap-2 text-sm">
                <div className="font-medium break-words col-span-1">{k}</div>
                <div className="col-span-2 break-words">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* footer actions */}
        <div className="p-4 border-t border-border flex flex-col sm:flex-row gap-2">
          <button onClick={copyJson} className="px-4 py-2 rounded-md bg-muted hover:bg-muted/70 text-sm">
            העתק JSON
          </button>
          {onExportOne && (
            <button onClick={() => onExportOne(row)} className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm">
              ייצוא XLS לשורה זו
            </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default ResponseDrawer;
