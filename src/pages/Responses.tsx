import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { Eye, Download } from 'lucide-react';
import ResponseDrawer from '../components/ResponseDrawer';

// טיפוס מקומי לנתוני התגובות
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
  lead_ref: string | null;
  questionnaire_id: string | null;
  questionnaire_title: string | null;
};

// טיפוס לשאלון
type Questionnaire = {
  id: string;
  title: string;
};

const Responses: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<ResponseFlat[]>([]);
  const [filteredData, setFilteredData] = useState<ResponseFlat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loadingQuestionnaires, setLoadingQuestionnaires] = useState(false);
  
  // State ל-Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<ResponseFlat | null>(null);

  // פילטרים מה-URL
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const lang = searchParams.get('lang') || '';
  const channel = searchParams.get('channel') || '';
  const questionnaireId = searchParams.get('questionnaireId') || '';
  const q = searchParams.get('q') || '';
  const offset = parseInt(searchParams.get('offset') || '0');

  const hasMore = useMemo(() => filteredData.length === 20, [filteredData.length]);

  // 1) פונקציית תקציר (אם אין כבר)
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

  // פונקציה ליצירת תוכן Tooltip
  const getTooltipContent = (answers: any): string => {
    if (!answers || typeof answers !== 'object') {
      return 'אין תשובות';
    }

    const entries = Object.entries(answers);
    if (entries.length === 0) {
      return 'אין תשובות';
    }

    // מיון לפי סדר עדיפות
    const priorityFields = ['need', 'timeline', 'budget', 'city', 'category', 'topic', 'service'];
    const sortedEntries = entries.sort(([a], [b]) => {
      const aIndex = priorityFields.indexOf(a);
      const bIndex = priorityFields.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    // חזור עד 6 פריטים עיקריים
    return sortedEntries
      .slice(0, 6)
      .map(([key, value]) => {
        if (typeof value === 'string' && value.trim()) {
          return `${key}: ${value.trim()}`;
        }
        return null;
      })
      .filter(Boolean)
      .join('\n');
  };

  // פונקציה לפתיחת Drawer
  const handleOpenDrawer = (row: ResponseFlat) => {
    setSelectedRow(row);
    setDrawerOpen(true);
  };

  // פונקציה לסגירת Drawer
  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedRow(null);
  };

  // 2) ייצוא כתוכן TSV עם BOM, אבל בסיומת .xls כדי שאקסל יפתח מושלם
  const exportToExcelXls = (rows: ResponseFlat[]) => {
    // headers (English)
    const headers = [
      'submitted_at',
      'questionnaire',
      'lang',
      'channel',
      'lead_name',
      'lead_email',
      'lead_phone',
      'lead_ref',
      'response_id',
      'summary'
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
        fmtDate(r.submitted_at),
        r.questionnaire_title ?? '',
        r.lang ?? '',
        r.channel ?? '',
        r.lead_name ?? '',
        r.lead_email ?? '',
        asPhoneText(r.lead_phone ?? ''),
        r.lead_ref ?? '',
        r.response_id ?? '',
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

    // שימי לב לתוכן (Excel MIME) ולסיומת .xls
    const blob = new Blob([BOM, buf], { type: 'application/vnd.ms-excel;charset=utf-16le;' });
    const d = new Date();
    const fileName = `responses_export_${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}.xls`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // טעינת רשימת השאלונים
  const fetchQuestionnaires = useCallback(async () => {
    try {
      setLoadingQuestionnaires(true);
      const { data: questionnairesData, error: questionnairesError } = await supabase
        .from('questionnaires')
        .select('id, title')
        .order('title');

      if (questionnairesError) {
        console.error('Error fetching questionnaires:', questionnairesError);
        return;
      }

      setQuestionnaires(questionnairesData || []);
    } catch (err) {
      console.error('Error fetching questionnaires:', err);
    } finally {
      setLoadingQuestionnaires(false);
    }
  }, []);

  // טעינת נתונים עם פילטרים
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('responses_flat')
        .select('*')
        .order('submitted_at', { ascending: false })
        .range(offset, offset + 19);

      // סינון לפי שפה
      if (lang) {
        query = query.eq('lang', lang);
      }

      // סינון לפי ערוץ
      if (channel) {
        query = query.eq('channel', channel);
      }

      // סינון לפי שאלון
      if (questionnaireId) {
        query = query.eq('questionnaire_id', questionnaireId);
      }

      // סינון לפי תאריכים
      if (from) {
        const fromStartOfDay = new Date(from);
        fromStartOfDay.setHours(0, 0, 0, 0);
        query = query.gte('submitted_at', fromStartOfDay.toISOString());
      }

      if (to) {
        const toEndOfDay = new Date(to);
        toEndOfDay.setHours(23, 59, 59, 999);
        query = query.lte('submitted_at', toEndOfDay.toISOString());
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
  }, [from, to, lang, channel, questionnaireId, offset]);

  // סינון צד לקוח לפי חיפוש טקסט
  useEffect(() => {
    if (!q.trim()) {
      setFilteredData(data);
      return;
    }

    const searchTerm = q.toLowerCase().trim();
    const filtered = data.filter(response => {
      // חיפוש בשם, אימייל וכותרת השאלון
      if (response.lead_name?.toLowerCase().includes(searchTerm)) return true;
      if (response.lead_email?.toLowerCase().includes(searchTerm)) return true;
      if (response.questionnaire_title?.toLowerCase().includes(searchTerm)) return true;
      
      // חיפוש בתשובות (JSON)
      try {
        const answersString = JSON.stringify(response.answers || {})
          .replace(/\s+/g, ' ')
          .toLowerCase();
        if (answersString.includes(searchTerm)) return true;
      } catch {
        // אם יש שגיאה ב-JSON, נדלג
      }
      
      return false;
    });

    setFilteredData(filtered);
  }, [data, q]);

  // טעינת נתונים בעת שינוי פילטרים
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // טעינת שאלונים בטעינה הראשונית
  useEffect(() => {
    fetchQuestionnaires();
  }, [fetchQuestionnaires]);

  // עדכון פילטר
  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('offset', '0'); // איפוס offset בעת שינוי פילטר
    setSearchParams(newParams);
  };

  // איפוס כל הפילטרים
  const resetFilters = () => {
    setSearchParams({ offset: '0' });
  };

  // ניווט
  const handlePrevious = () => {
    if (offset >= 20) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('offset', (offset - 20).toString());
      setSearchParams(newParams);
    }
  };

  const handleNext = () => {
    if (hasMore) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('offset', (offset + 20).toString());
      setSearchParams(newParams);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('he-IL');
    } catch {
      return '—';
    }
  };

  const formatField = (value: string | null) => {
    return value || '—';
  };

  const getLanguageBadge = (lang: string | null) => {
    if (!lang) return <span className="text-muted-foreground">—</span>;
    
    const isHebrew = lang === 'he';
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        isHebrew 
          ? 'bg-blue-100 text-blue-800' 
          : 'bg-green-100 text-green-800'
      }`}>
        {isHebrew ? 'עברית' : 'English'}
      </span>
    );
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

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background" dir="rtl">
        <div className="container mx-auto p-4 sm:p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">תגובות</h1>
            <p className="text-muted-foreground">ניהול וצפייה בתגובות השאלונים שלך</p>
          </div>

          {/* Filters Bar */}
          <div className="bg-card border border-border rounded-lg p-3 sm:p-4 mb-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">סינון תגובות</h3>
            
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

              {/* Language */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1 text-right">שפה</label>
                <select
                  value={lang}
                  onChange={(e) => updateFilter('lang', e.target.value)}
                  className="w-full px-2 py-1 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">—</option>
                  <option value="he">עברית</option>
                  <option value="en">English</option>
                </select>
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
                  disabled={loadingQuestionnaires}
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
                  placeholder="חיפוש בתשובות/שם/אימייל…"
                  className="w-full px-2 py-1 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Reset Button */}
            <div className="mt-3 flex justify-end">
              <button
                onClick={resetFilters}
                className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                איפוס
              </button>
            </div>
          </div>

          {/* Actions Bar — תמיד מוצג */}
          <div className="bg-card border border-border rounded-lg p-3 sm:p-4 mb-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {filteredData.length > 0
                ? `מוצגות ${filteredData.length} רשומות בעמוד`
                : (loading ? 'טוען נתונים…' : 'אין נתונים להצגה')}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={() => exportToExcelXls(filteredData)}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                disabled={filteredData.length === 0}
                title={filteredData.length === 0 ? 'אין נתונים לייצוא' : 'ייצוא לאקסל'}
              >
                יצוא לאקסל (XLS)
              </button>

              {/* אם תרצי להשאיר גם CSV/TSV ישנים, הוסיפי כאן עוד כפתור(ים) */}
            </div>
          </div>

          {/* Content Area */}
          <div className="bg-card rounded-lg border border-border">
            {/* Loading State */}
            {loading && (
              <div className="p-8">
                <div className="space-y-4">
                  <div className="h-8 bg-muted rounded animate-pulse"></div>
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-12 bg-muted rounded animate-pulse"></div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="p-8 text-center">
                <div className="text-destructive text-lg font-medium mb-2">שגיאה בטעינת הנתונים</div>
                <div className="text-muted-foreground text-sm">{error}</div>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredData.length === 0 && (
              <div className="p-8 text-center">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-lg font-medium text-muted-foreground mb-2">
                  {data.length === 0 ? 'אין תגובות עדיין' : 'לא נמצאו תוצאות לפילטרים שנבחרו'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {data.length === 0 
                    ? 'כאשר אנשים יתחילו למלא את השאלונים שלך, התגובות יופיעו כאן'
                    : 'נסה לשנות את הפילטרים או לחפש משהו אחר'
                  }
                </p>
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
                          שאלון
                        </th>
                        <th className="text-right p-4 text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">
                          שפה
                        </th>
                        <th className="text-right p-4 text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">
                          ערוץ
                        </th>
                        <th className="text-right p-4 text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">
                          שם/אימייל
                        </th>
                        <th className="text-right p-4 text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">
                          תקציר
                        </th>
                        <th className="text-right p-4 text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap hidden sm:table-cell">
                          Ref
                        </th>
                        <th className="text-right p-4 text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">
                          פעולות
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredData.map((response) => (
                        <tr key={response.response_id} className="hover:bg-muted/50 transition-colors">
                          <td className="p-4 text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                            {formatDate(response.submitted_at)}
                          </td>
                          <td className="p-4 text-xs sm:text-sm break-words max-w-[200px]">
                            {formatField(response.questionnaire_title)}
                          </td>
                          <td className="p-4">
                            {getLanguageBadge(response.lang)}
                          </td>
                          <td className="p-4 text-xs sm:text-sm whitespace-nowrap">
                            {getChannelBadge(response.channel)}
                          </td>
                          <td className="p-4 text-xs sm:text-sm break-words max-w-[200px]">
                            <div>
                              <div className="font-medium">{formatField(response.lead_name)}</div>
                              <div className="text-muted-foreground">{formatField(response.lead_email)}</div>
                            </div>
                          </td>
                          <td className="p-4 text-xs sm:text-sm break-words max-w-[250px]">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div 
                                  className="line-clamp-2 sm:line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                                  title={summarizeAnswers(response.answers)}
                                  onClick={() => handleOpenDrawer(response)}
                                >
                                  {summarizeAnswers(response.answers)}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <div className="whitespace-pre-line text-xs">
                                  {getTooltipContent(response.answers)}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </td>
                          <td className="p-4 text-xs sm:text-sm text-muted-foreground whitespace-nowrap hidden sm:table-cell">
                            {formatField(response.lead_ref)}
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleOpenDrawer(response)}
                              className="inline-flex items-center justify-center p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                              title="פרטים"
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
                    disabled={!hasMore}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      !hasMore
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

        {/* Response Drawer */}
        <ResponseDrawer
          open={drawerOpen}
          onClose={handleCloseDrawer}
          row={selectedRow}
          onExportOne={(row) => exportToExcelXls([row])}
        />
      </div>
    </TooltipProvider>
  );
};

export default Responses;