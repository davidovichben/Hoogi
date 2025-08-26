import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { X, Save, Download, Star, Calendar, User, Mail, Phone, Hash, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

// Types
type LeadRow = {
  lead_id: string;
  created_at: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  ref: string | null;
  channel: string | null;
  status: string | null;
  rating: number | null;
  notes: string | null;
};

type ResponseFlat = {
  response_id: string;
  submitted_at: string;
  questionnaire_title: string | null;
  answers: any;
};

type LeadDrawerProps = {
  open: boolean;
  onClose: () => void;
  lead: LeadRow | null;
};

// Helper functions
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mi = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  } catch {
    return '—';
  }
};

const getChannelBadge = (channel: string | null) => {
  if (!channel) return <span className="text-muted-foreground">—</span>;
  const map: Record<string, string> = {
    landing: 'bg-purple-100 text-purple-800',
    whatsapp: 'bg-emerald-100 text-emerald-800',
    mail: 'bg-sky-100 text-sky-800',
    qr: 'bg-amber-100 text-amber-800',
    other: 'bg-zinc-200 text-zinc-800'
  };
  return <Badge className={map[channel] ?? 'bg-zinc-200 text-zinc-800'}>{channel}</Badge>;
};

const getStatusBadge = (status: string | null) => {
  if (!status) return <span className="text-muted-foreground">—</span>;
  
  const statusMap: Record<string, { color: string; label: string }> = {
    new: { color: 'bg-slate-100 text-slate-800', label: 'חדש' },
    in_progress: { color: 'bg-amber-100 text-amber-800', label: 'בטיפול' },
    won: { color: 'bg-emerald-100 text-emerald-800', label: 'נסגר/המיר' },
    lost: { color: 'bg-zinc-100 text-zinc-800', label: 'לא רלוונטי' },
    spam: { color: 'bg-rose-100 text-rose-800', label: 'ספאם' }
  };
  
  const statusInfo = statusMap[status] || { color: 'bg-zinc-100 text-zinc-800', label: status };
  
  return <Badge className={statusInfo.color}>{statusInfo.label}</Badge>;
};

const summarizeAnswers = (answers: any): string => {
  try {
    if (!answers || typeof answers !== 'object') return '—';
    const keys = ['need','timeline','budget','city','category','topic','service'];
    const parts: string[] = [];
    for (const k of keys) {
      if (answers[k]) {
        const v = typeof answers[k] === 'object' ? JSON.stringify(answers[k]) : String(answers[k]);
        parts.push(`${k}: ${v}`);
      }
      if (parts.length >= 3) break;
    }
    if (parts.length === 0) {
      for (const [k,v] of Object.entries(answers).slice(0,3)) {
        parts.push(`${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`);
      }
    }
    const s = parts.join(' • ');
    return s.length > 120 ? s.slice(0,117) + '…' : s;
  } catch { return '—'; }
};

// Export function for single lead with responses
const exportLeadWithResponses = (lead: LeadRow, responses: ResponseFlat[]) => {
  const headers = [
    'lead_id', 'created_at', 'name', 'email', 'phone', 'ref', 'channel', 'status', 'rating', 'notes',
    'response_id', 'submitted_at', 'questionnaire', 'answers_summary'
  ];

  const fmtDate = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const dd = String(d.getDate()).padStart(2,'0');
    const hh = String(d.getHours()).padStart(2,'0');
    const mi = String(d.getMinutes()).padStart(2,'0');
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  };

  const asPhoneText = (p?: string | null) => p ? `'${p}` : '';

  const rows2D: string[][] = [headers];
  
  // Add lead row
  rows2D.push([
    lead.lead_id,
    fmtDate(lead.created_at),
    lead.name ?? '',
    lead.email ?? '',
    asPhoneText(lead.phone ?? ''),
    lead.ref ?? '',
    lead.channel ?? '',
    lead.status ?? '',
    (lead.rating ?? '').toString(),
    lead.notes ?? '',
    '', '', '', '' // Empty response fields for lead row
  ]);

  // Add response rows
  for (const r of responses) {
    rows2D.push([
      lead.lead_id,
      fmtDate(lead.created_at),
      lead.name ?? '',
      lead.email ?? '',
      asPhoneText(lead.phone ?? ''),
      lead.ref ?? '',
      lead.channel ?? '',
      lead.status ?? '',
      (lead.rating ?? '').toString(),
      lead.notes ?? '',
      r.response_id ?? '',
      fmtDate(r.submitted_at),
      r.questionnaire_title ?? '',
      summarizeAnswers(r.answers)
    ]);
  }

  const tsv = rows2D
    .map(cols => cols.map(c => (c ?? '').toString().replace(/\t/g,' ').replace(/\r?\n/g,' ')).join('\t'))
    .join('\r\n');

  // UTF-16LE + BOM
  const BOM = new Uint8Array([0xFF, 0xFE]);
  const buf = new Uint16Array(tsv.length);
  for (let i=0;i<tsv.length;i++) buf[i] = tsv.charCodeAt(i);

  const blob = new Blob([BOM, buf], { type: 'application/vnd.ms-excel;charset=utf-16le;' });
  const d = new Date();
  const fileName = `lead_${lead.lead_id}_export_${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}.xls`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const LeadDrawer: React.FC<LeadDrawerProps> = ({ open, onClose, lead }) => {
  const navigate = useNavigate();
  const [responses, setResponses] = useState<ResponseFlat[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState<string>('');

  // Load responses when lead changes
  useEffect(() => {
    if (lead && open) {
      loadResponses();
      setStatus(lead.status || '');
      setRating(lead.rating || undefined);
      setNotes(lead.notes || '');
    }
  }, [lead, open]);

  const loadResponses = async () => {
    if (!lead) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('responses_flat')
        .select('*')
        .eq('lead_id', lead.lead_id)
        .order('submitted_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setResponses(data || []);
    } catch (err) {
      console.error('Failed to load responses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!lead) return;
    
    try {
      setSaving(true);
      const { error } = await supabase
        .from('leads')
        .update({ 
          status: status || null, 
          rating: rating || null, 
          notes: notes || null 
        })
        .eq('id', lead.lead_id);

      if (error) throw error;
      
      // Update local lead object
      if (lead) {
        lead.status = status;
        lead.rating = rating;
        lead.notes = notes;
      }
    } catch (err) {
      console.error('Failed to save lead:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenResponse = (responseId: string) => {
    // Navigate to responses page with filter
    navigate(`/responses?response_id=${responseId}`);
    onClose();
  };

  const handleExport = () => {
    if (lead) {
      exportLeadWithResponses(lead, responses);
    }
  };

  if (!open || !lead) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end sm:items-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity" 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative w-full sm:max-w-[520px] h-full sm:h-auto bg-background border-l border-border shadow-xl transition-transform">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">פרטי ליד</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 max-h-[calc(100vh-120px)] overflow-y-auto">
          {/* Meta Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(lead.created_at)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">סטטוס:</span>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="בחר סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">חדש</SelectItem>
                  <SelectItem value="in_progress">בטיפול</SelectItem>
                  <SelectItem value="won">נסגר/המיר</SelectItem>
                  <SelectItem value="lost">לא רלוונטי</SelectItem>
                  <SelectItem value="spam">ספאם</SelectItem>
                </SelectContent>
              </Select>
              {status && getStatusBadge(status)}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">דירוג:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(rating === star ? undefined : star)}
                    className="text-muted-foreground hover:text-amber-500 transition-colors"
                  >
                    <Star 
                      className={`h-5 w-5 ${rating && rating >= star ? 'fill-amber-500 text-amber-500' : ''}`} 
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">ערוץ:</span>
              {getChannelBadge(lead.channel)}
            </div>
          </div>

          {/* Contact Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">פרטי קשר</h3>
            
            {lead.name && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{lead.name}</span>
              </div>
            )}
            
            {lead.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={`mailto:${lead.email}`}
                  className="text-sm text-primary hover:underline"
                >
                  {lead.email}
                </a>
              </div>
            )}
            
            {lead.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={`tel:${lead.phone}`}
                  className="text-sm text-primary hover:underline"
                >
                  {lead.phone}
                </a>
              </div>
            )}
            
            {lead.ref && (
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{lead.ref}</span>
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">הערות</h3>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="הוסף הערות על הליד..."
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Responses History Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">היסטוריית תגובות</h3>
            
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">טוען...</div>
            ) : responses.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">אין תגובות</div>
            ) : (
              <div className="space-y-2">
                {responses.map((response) => (
                  <div key={response.response_id} className="p-3 border border-border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {formatDate(response.submitted_at)}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenResponse(response.response_id)}
                      >
                        פתח תגובה
                      </Button>
                    </div>
                    
                    {response.questionnaire_title && (
                      <div className="text-sm font-medium">
                        {response.questionnaire_title}
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground leading-relaxed">
                      {summarizeAnswers(response.answers)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center gap-2 p-4 border-t border-border bg-muted/20">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1"
          >
            {saving ? 'שומר...' : 'שמירה'}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            ייצוא XLS
          </Button>
          
          <Button
            variant="ghost"
            onClick={onClose}
          >
            סגור
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LeadDrawer;
