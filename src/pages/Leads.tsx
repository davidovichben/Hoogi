import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { Eye, Phone, Mail, MessageSquare, Download } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip';
import LeadDrawer from '../components/LeadDrawer';

// Types
type LeadFlat = {
  lead_id: string;
  created_at: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  channel: string | null;
  lead_ref: string | null;
  questionnaire_id: string | null;
  questionnaire_title: string | null;
  score: number | null;
  status: string | null;
  rating: number | null;
};

type Questionnaire = {
  id: string;
  title: string;
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
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
  } catch {
    return '—';
  }
};

const formatField = (value: string | null) => {
  return value || '—';
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
  return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${map[channel] ?? 'bg-zinc-200 text-zinc-800'}`}>{channel}</span>;
};

const getScoreBadge = (score: number | null) => {
  if (score === null) return <span className="text-muted-foreground">—</span>;
  
  let colorClass = 'bg-zinc-200 text-zinc-800';
  if (score >= 80) colorClass = 'bg-emerald-100 text-emerald-800';
  else if (score >= 60) colorClass = 'bg-amber-100 text-amber-800';
  else if (score >= 40) colorClass = 'bg-orange-100 text-orange-800';
  else colorClass = 'bg-rose-100 text-rose-800';
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {score}
    </span>
  );
};

const getLeadStatusBadge = (status: string | null) => {
  if (!status) return <span className="text-muted-foreground">—</span>;
  
  const statusMap: Record<string, { color: string; label: string }> = {
    new: { color: 'bg-slate-100 text-slate-800', label: 'חדש' },
    in_progress: { color: 'bg-amber-100 text-amber-800', label: 'בטיפול' },
    won: { color: 'bg-emerald-100 text-emerald-800', label: 'נסגר/המיר' },
    lost: { color: 'bg-zinc-100 text-zinc-800', label: 'לא רלוונטי' },
    spam: { color: 'bg-rose-100 text-rose-800', label: 'ספאם' }
  };
  
  const statusInfo = statusMap[status] || { color: 'bg-zinc-100 text-zinc-800', label: status };
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
      {statusInfo.label}
    </span>
  );
};

// היגיון בסיסי לנורמליזציית מספר ישראלי ל-E.164 (MVP)
const normalizeILPhone = (raw?: string | null) => {
  if (!raw) return '';
  const digits = raw.replace(/[^\d+]/g,'');
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('0') && digits.length === 10) {
    return '+972' + digits.slice(1);
  }
  return digits; // fallback
};

const buildWhatsAppLink = (phone?: string | null, questionnaire?: string | null) => {
  const to = normalizeILPhone(phone);
  const txt = encodeURIComponent(
    `שלום! תודה שמילאת את השאלון${questionnaire ? `: ${questionnaire}` : ''}. נחזור אליך בקרוב.`
  );
  return to ? `https://wa.me/${to.replace('+','')}/?text=${txt}` : '';
};

// Export function - XLS format with UTF-16LE + BOM
const exportToExcelXls = (rows: LeadFlat[]) => {
  // headers (English)
  const headers = [
    'created_at','name','email','phone','channel','ref','questionnaire','status','rating'
  ];

  const fmtDate = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const dd = String(d.getDate()).padStart(2,'0');
    const hh = String(d.getHours()).padStart(2,'0');
    const mi = String(d.getMinutes()).padStart(2,'0');
    const ss = String(d.getSeconds()).padStart(2,'0');
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
  };

  const asPhoneText = (p?: string | null) => p ? `'${p}` : '';

  const rows2D: string[][] = [headers];
  for (const r of rows) {
    rows2D.push([
      fmtDate(r.created_at),
      r.name ?? '',
      r.email ?? '',
      asPhoneText(r.phone ?? ''),
      r.channel ?? '',
      r.lead_ref ?? '',
      r.questionnaire_title ?? '',
      r.status ?? '',
      (r.rating ?? '').toString()
    ]);
  }

  const tsv = rows2D
    .map(cols => cols.map(c => (c ?? '').toString().replace(/\t/g,' ').replace(/\r?\n/g,' ')).join('\t'))
    .join('\r\n');

  // UTF-16LE + BOM
  const BOM = new Uint8Array([0xFF, 0xFE]);
  const buf = new Uint16Array(tsv.length);
  for (let i=0;i<tsv.length;i++) buf[i] = tsv.charCodeAt(i);

  // שימי לב לתוכן (Excel MIME) ולסיומת .xls
  const blob = new Blob([BOM, buf], { type: 'application/vnd.ms-excel;charset=utf-16le;' });
  const d = new Date();
  const fileName = `leads_export_${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}.xls`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

// Main component
const Leads: React.FC = () => {
  // State
  const [data, setData] = useState<LeadFlat[]>([]);
  const [filteredData, setFilteredData] = useState<LeadFlat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  
  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadFlat | null>(null);

  // URL Search Params
  const [searchParams, setSearchParams] = useSearchParams();
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const channel = searchParams.get('channel') || '';
  const questionnaireId = searchParams.get('questionnaireId') || '';
  const statusParam = searchParams.get('status') || '';
  const q = searchParams.get('q') || '';
  const offset = parseInt(searchParams.get('offset') || '0');

  // Fetch leads data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('leads_flat_v2')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (channel) {
        query = query.eq('channel', channel);
      }

      if (questionnaireId) {
        query = query.eq('questionnaire_id', questionnaireId);
      }

      if (statusParam) {
        query = query.eq('status', statusParam);
      }

      if (from) {
        const fromStartOfDay = new Date(from);
        fromStartOfDay.setHours(0, 0, 0, 0);
        query = query.gte('created_at', fromStartOfDay.toISOString());
      }

      if (to) {
        const toEndOfDay = new Date(to);
        toEndOfDay.setHours(23, 59, 59, 999);
        query = query.lte('created_at', toEndOfDay.toISOString());
      }

      // Apply range after all filters
      query = query.range(offset, offset + 19);

      const { data: responseData, error: responseError } = await query;

      if (responseError) {
        throw new Error(responseError.message);
      }

      setData(responseData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה לא ידועה');
    } finally {
      setLoading(false);
    }
  }, [from, to, channel, questionnaireId, statusParam, offset]);

  // Client-side search filtering
  useEffect(() => {
    if (!q.trim()) {
      setFilteredData(data);
      return;
    }

    const searchTerm = q.toLowerCase().trim();
    const filtered = data.filter(lead => {
      // Search in name, email, phone, and questionnaire title
      if (lead.name?.toLowerCase().includes(searchTerm)) return true;
      if (lead.email?.toLowerCase().includes(searchTerm)) return true;
      if (lead.phone?.toLowerCase().includes(searchTerm)) return true;
      if (lead.questionnaire_title?.toLowerCase().includes(searchTerm)) return true;
      
      return false;
    });

    setFilteredData(filtered);
  }, [data, q]);

  // Load data when filters change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch questionnaires on initial load
  const fetchQuestionnaires = useCallback(async () => {
    try {
      const { data: questionnairesData, error } = await supabase
        .from('questionnaires')
        .select('id, title')
        .order('title');

      if (error) throw error;
      setQuestionnaires(questionnairesData || []);
    } catch (err) {
      console.error('Failed to fetch questionnaires:', err);
    }
  }, []);

  useEffect(() => {
    fetchQuestionnaires();
  }, [fetchQuestionnaires]);

  // Update filter
  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('offset', '0'); // Reset offset when filter changes
    setSearchParams(newParams);
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchParams({ offset: '0' });
  };

  // Navigation
  const handlePrevious = () => {
    if (offset >= 20) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('offset', (offset - 20).toString());
      setSearchParams(newParams);
    }
  };

  const handleNext = () => {
    if (filteredData.length === 20) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('offset', (offset + 20).toString());
      setSearchParams(newParams);
    }
  };

  // Drawer handlers
  const handleOpenDrawer = (lead: LeadFlat) => {
    setSelectedLead(lead);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedLead(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <div className="container mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">לידים</h1>
          <p className="text-muted-foreground mt-2">ניהול ועקיבה אחר לידים</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {/* Total Leads */}
          <div className="bg-card border border-border p-3 rounded-lg">
            <div className="text-xs sm:text-sm text-muted-foreground mb-1">סה"כ לידים</div>
            <div className="text-lg sm:text-2xl font-bold text-foreground">
              {filteredData.length}
            </div>
          </div>

          {/* Today's Leads */}
          <div className="bg-card border border-border p-3 rounded-lg">
            <div className="text-xs sm:text-sm text-muted-foreground mb-1">היום</div>
            <div className="text-lg sm:text-2xl font-bold text-foreground">
              {(() => {
                const today = new Date();
                const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
                
                return filteredData.filter(lead => {
                  const leadDate = new Date(lead.created_at);
                  return leadDate >= todayStart && leadDate <= todayEnd;
                }).length;
              })()}
            </div>
          </div>

          {/* Top Channel */}
          <div className="bg-card border border-border p-3 rounded-lg">
            <div className="text-xs sm:text-sm text-muted-foreground mb-1">ערוץ מוביל</div>
            <div className="text-lg sm:text-2xl font-bold text-foreground">
              {(() => {
                const channelCounts = filteredData.reduce((acc, lead) => {
                  if (lead.channel) {
                    acc[lead.channel] = (acc[lead.channel] || 0) + 1;
                  }
                  return acc;
                }, {} as Record<string, number>);
                
                const topChannel = Object.entries(channelCounts).sort(([,a], [,b]) => b - a)[0];
                return topChannel ? topChannel[0] : '—';
              })()}
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="bg-card border border-border p-3 rounded-lg">
            <div className="text-xs sm:text-sm text-muted-foreground mb-1">המרה</div>
            <div className="text-lg sm:text-2xl font-bold text-foreground">
              {(() => {
                if (filteredData.length === 0) return '0%';
                const wonCount = filteredData.filter(lead => lead.status === 'won').length;
                const conversionRate = Math.round((wonCount / filteredData.length) * 100);
                return `${conversionRate}%`;
              })()}
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-card border border-border rounded-lg p-3 sm:p-4 mb-4">
          <div className="text-sm font-medium text-muted-foreground mb-3">סינון לידים</div>
          
          <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
            {/* From Date */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1 text-right">מתאריך</label>
              <input
                type="date"
                value={from}
                onChange={(e) => updateFilter('from', e.target.value)}
                className="w-full px-2 py-1 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* To Date */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1 text-right">עד תאריך</label>
              <input
                type="date"
                value={to}
                onChange={(e) => updateFilter('to', e.target.value)}
                className="w-full px-2 py-1 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Channel */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1 text-right">ערוץ</label>
              <select
                value={channel}
                onChange={(e) => updateFilter('channel', e.target.value)}
                className="w-full px-2 py-1 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">—</option>
                <option value="landing">Landing</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="mail">Mail</option>
                <option value="qr">QR</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1 text-right">סטטוס</label>
              <select
                value={statusParam}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="w-full px-2 py-1 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">—</option>
                <option value="new">חדש</option>
                <option value="in_progress">בטיפול</option>
                <option value="won">נסגר/המיר</option>
                <option value="lost">לא רלוונטי</option>
                <option value="spam">ספאם</option>
              </select>
            </div>

            {/* Questionnaire */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1 text-right">שאלון</label>
              <select
                value={questionnaireId}
                onChange={(e) => updateFilter('questionnaireId', e.target.value)}
                className="w-full px-2 py-1 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">—</option>
                {questionnaires.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1 text-right">חיפוש</label>
              <input
                type="text"
                value={q}
                onChange={(e) => updateFilter('q', e.target.value)}
                placeholder="שם, אימייל, טלפון..."
                className="w-full px-2 py-1 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="w-full px-3 py-1 text-xs bg-muted text-muted-foreground hover:bg-muted/80 rounded-md transition-colors"
              >
                איפוס
              </button>
            </div>
          </div>
        </div>

        {/* Export Button */}
        {!loading && !error && filteredData.length > 0 && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => exportToExcelXls(filteredData)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors text-sm font-medium"
            >
              <Download className="h-4 w-4" />
              ייצוא לאקסל (XLS)
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">טוען...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
            <div className="text-destructive text-sm">{error}</div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredData.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground text-lg">אין לידים להצגה</div>
            <div className="text-muted-foreground text-sm mt-2">נסה לשנות את הפילטרים או לחזור מאוחר יותר</div>
          </div>
        )}

        {/* Data Table */}
        {!loading && !error && filteredData.length > 0 && (
          <>
            <div className="overflow-x-auto w-full">
              <table className="w-full table-auto">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-right p-4 text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">
                      תאריך
                    </th>
                    <th className="text-right p-4 text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">
                      שם
                    </th>
                    <th className="text-right p-4 text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">
                      אימייל
                    </th>
                    <th className="text-right p-4 text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">
                      טלפון
                    </th>
                    <th className="text-right p-4 text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">
                      ערוץ
                    </th>
                    <th className="text-right p-4 text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">
                      Ref
                    </th>
                    <th className="text-right p-4 text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">
                      שאלון
                    </th>
                    <th className="text-right p-4 text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">
                      ציון
                    </th>
                    <th className="text-right p-4 text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">
                      סטטוס
                    </th>
                    <th className="text-right p-4 text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">
                      יצירת קשר
                    </th>
                    <th className="text-right p-4 text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">
                      פרטים
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredData.map((lead) => (
                    <tr key={lead.lead_id} className="hover:bg-muted/50 transition-colors">
                      <td 
                        className="p-4 text-xs sm:text-sm text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground"
                        onClick={() => handleOpenDrawer(lead)}
                        title="לחץ לפתיחת פרטי הליד"
                      >
                        {formatDate(lead.created_at)}
                      </td>
                      <td 
                        className="p-4 text-xs sm:text-sm break-words max-w-[150px] cursor-pointer hover:text-foreground"
                        onClick={() => handleOpenDrawer(lead)}
                        title="לחץ לפתיחת פרטי הליד"
                      >
                        {formatField(lead.name)}
                      </td>
                      <td className="p-4 text-xs sm:text-sm break-words max-w-[200px]">
                        {formatField(lead.email)}
                      </td>
                      <td className="p-4 text-xs sm:text-sm whitespace-nowrap">
                        {formatField(lead.phone)}
                      </td>
                      <td className="p-4 text-xs sm:text-sm whitespace-nowrap">
                        {getChannelBadge(lead.channel)}
                      </td>
                      <td className="p-4 text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                        {formatField(lead.lead_ref)}
                      </td>
                      <td className="p-4 text-xs sm:text-sm break-words max-w-[200px]">
                        {formatField(lead.questionnaire_title)}
                      </td>
                      <td className="p-4 text-xs sm:text-sm whitespace-nowrap">
                        {getScoreBadge(lead.score)}
                      </td>
                      <td className="p-4 text-xs sm:text-sm whitespace-nowrap">
                        {getLeadStatusBadge(lead.status)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 justify-center">
                          {/* Phone */}
                          {lead.phone && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <a
                                  href={`tel:${lead.phone}`}
                                  className="inline-flex items-center justify-center p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                                  title="התקשר"
                                >
                                  <Phone className="h-4 w-4" />
                                </a>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>התקשר</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          
                          {/* Email */}
                          {lead.email && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <a
                                  href={`mailto:${lead.email}`}
                                  className="inline-flex items-center justify-center p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                                  title="שלח אימייל"
                                >
                                  <Mail className="h-4 w-4" />
                                </a>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>שלח אימייל</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          
                          {/* WhatsApp */}
                          {lead.phone && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <a
                                  href={buildWhatsAppLink(lead.phone, lead.questionnaire_title)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                                  title="שלח WhatsApp"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </a>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>שלח WhatsApp</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleOpenDrawer(lead)}
                          className="inline-flex items-center justify-center p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                          title="פתח פרטי ליד"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t border-border">
              <button
                onClick={handlePrevious}
                disabled={offset === 0}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  offset === 0
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                קודם
              </button>
              
              <div className="text-sm text-muted-foreground">
                עמוד {Math.floor(offset / 20) + 1}
              </div>
              
              <button
                onClick={handleNext}
                disabled={filteredData.length < 20}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  filteredData.length < 20
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                הבא
              </button>
            </div>
          </>
        )}
      </div>
      
      {/* Lead Drawer */}
      <LeadDrawer 
        open={drawerOpen} 
        onClose={handleCloseDrawer} 
        lead={selectedLead} 
      />
    </div>
  );
};

export default Leads;