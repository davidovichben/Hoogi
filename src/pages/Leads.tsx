import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { Eye, Phone, Mail, MessageSquare } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip';

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

// Main component
const Leads: React.FC = () => {
  // State
  const [data, setData] = useState<LeadFlat[]>([]);
  const [filteredData, setFilteredData] = useState<LeadFlat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);

  // URL Search Params
  const [searchParams, setSearchParams] = useSearchParams();
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const channel = searchParams.get('channel') || '';
  const questionnaireId = searchParams.get('questionnaireId') || '';
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
        .order('created_at', { ascending: false })
        .range(offset, offset + 19);

      // Apply filters
      if (channel) {
        query = query.eq('channel', channel);
      }

      if (questionnaireId) {
        query = query.eq('questionnaire_id', questionnaireId);
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
  }, [from, to, channel, questionnaireId, offset]);

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

  // WhatsApp functions
  const normalizeILPhone = (raw?: string | null) => {
    if (!raw) return '';
    const digits = raw.replace(/[^\d+]/g,'');
    if (digits.startsWith('+')) return digits;
    if (digits.startsWith('0') && digits.length === 10) {
      return '+972' + digits.slice(1);
    }
    return digits;
  };

  const buildWhatsAppLink = (phone?: string | null, questionnaire?: string | null) => {
    const to = normalizeILPhone(phone);
    const txt = encodeURIComponent(
      `שלום! תודה שמילאת את השאלון${questionnaire ? `: ${questionnaire}` : ''}. נחזור אליך בקרוב.`
    );
    return to ? `https://wa.me/${to.replace('+','')}/?text=${txt}` : '';
  };

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <div className="container mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">לידים</h1>
          <p className="text-muted-foreground mt-2">ניהול ועקיבה אחר לידים</p>
        </div>

        {/* Filters Bar */}
        <div className="bg-card border border-border rounded-lg p-3 sm:p-4 mb-4">
          <div className="text-sm font-medium text-muted-foreground mb-3">סינון לידים</div>
          
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
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
                      פעולות
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredData.map((lead) => (
                    <tr key={lead.lead_id} className="hover:bg-muted/50 transition-colors">
                      <td className="p-4 text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(lead.created_at)}
                      </td>
                      <td className="p-4 text-xs sm:text-sm break-words max-w-[150px]">
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
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          {/* Phone */}
                          {lead.phone && (
                            <a
                              href={`tel:${lead.phone}`}
                              className="inline-flex items-center justify-center p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                              title="התקשר"
                            >
                              <Phone className="h-4 w-4" />
                            </a>
                          )}
                          
                          {/* Email */}
                          {lead.email && (
                            <a
                              href={`mailto:${lead.email}`}
                              className="inline-flex items-center justify-center p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                              title="שלח אימייל"
                            >
                              <Mail className="h-4 w-4" />
                            </a>
                          )}
                          
                          {/* WhatsApp */}
                          {lead.phone && (
                            <a
                              href={buildWhatsAppLink(lead.phone, lead.questionnaire_title)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                              title="שלח WhatsApp"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </a>
                          )}
                        </div>
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
    </div>
  );
};

export default Leads;