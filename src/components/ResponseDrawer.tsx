import React from 'react';
import { X, Copy, Download, Mail, Phone, Calendar, FileText, User, MessageCircle } from 'lucide-react';

// טיפוס לנתוני התגובה
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

interface ResponseDrawerProps {
  open: boolean;
  onClose: () => void;
  row: ResponseFlat | null;
}

const ResponseDrawer: React.FC<ResponseDrawerProps> = ({ open, onClose, row }) => {
  if (!row) return null;

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
    
    const channelColors: { [key: string]: string } = {
      landing: 'bg-purple-100 text-purple-800',
      whatsapp: 'bg-green-100 text-green-800',
      mail: 'bg-blue-100 text-blue-800',
      qr: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800'
    };
    
    const colorClass = channelColors[channel] || 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {channel}
      </span>
    );
  };

  const copyAnswersToClipboard = async () => {
    try {
      const formattedJson = JSON.stringify(row.answers, null, 2);
      await navigator.clipboard.writeText(formattedJson);
      // כאן אפשר להוסיף toast notification
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const exportToCSV = () => {
    try {
      // יצירת סיכום התשובות
      const summarizeAnswers = (answers: any): string => {
        if (!answers || typeof answers !== 'object') {
          return '—';
        }

        const priorityFields = ['need', 'timeline', 'budget', 'city', 'category', 'topic', 'service'];
        const summaryParts: string[] = [];

        for (const field of priorityFields) {
          if (answers[field] && typeof answers[field] === 'string' && answers[field].trim()) {
            summaryParts.push(`${answers[field].trim()}`);
          }
        }

        if (summaryParts.length === 0) {
          for (const [key, value] of Object.entries(answers)) {
            if (typeof value === 'string' && value.trim() && summaryParts.length < 3) {
              summaryParts.push(`${value.trim()}`);
            }
          }
        }

        if (summaryParts.length === 0) {
          return '—';
        }

        const summary = summaryParts.join(' • ');
        return summary.length > 120 ? summary.substring(0, 120) + '…' : summary;
      };

      const csvData = [
        'submitted_at',
        'questionnaire_title', 
        'lang',
        'channel',
        'lead_name',
        'lead_email',
        'lead_phone',
        'lead_ref',
        'response_id',
        'summary'
      ].join(',');

      const csvRow = [
        formatDate(row.submitted_at),
        `"${formatField(row.questionnaire_title)}"`,
        row.lang || '',
        row.channel || '',
        `"${formatField(row.lead_name)}"`,
        formatField(row.lead_email),
        formatField(row.lead_phone),
        formatField(row.lead_ref),
        row.response_id,
        `"${summarizeAnswers(row.answers)}"`
      ].join(',');

      const csvContent = `${csvData}\n${csvRow}`;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `response-${row.response_id}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export CSV:', err);
    }
  };

  return (
    <>
      {/* Overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full z-50 transform transition-transform duration-300 ease-in-out ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-full w-full max-w-[480px] bg-background border-l border-border shadow-xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">פרטי תגובה</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-md transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Meta Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">מידע כללי</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">תאריך</div>
                    <div className="text-sm font-medium">{formatDate(row.submitted_at)}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">שאלון</div>
                    <div className="text-sm font-medium">{formatField(row.questionnaire_title)}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">שפה</div>
                    <div>{getLanguageBadge(row.lang)}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">ערוץ</div>
                    <div>{getChannelBadge(row.channel)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lead Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">פרטי ליד</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">שם</div>
                    <div className="text-sm font-medium">{formatField(row.lead_name)}</div>
                  </div>
                </div>
                
                {row.lead_email && (
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">אימייל</div>
                      <a 
                        href={`mailto:${row.lead_email}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {row.lead_email}
                      </a>
                    </div>
                  </div>
                )}
                
                {row.lead_phone && (
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">טלפון</div>
                      <a 
                        href={`tel:${row.lead_phone}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {row.lead_phone}
                      </a>
                    </div>
                  </div>
                )}
                
                {row.lead_ref && (
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Ref</div>
                      <div className="text-sm font-medium">{row.lead_ref}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Answers Q&A Table */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">תשובות</h3>
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-right p-3 text-xs font-medium text-muted-foreground border-b border-border">
                          שאלה
                        </th>
                        <th className="text-right p-3 text-xs font-medium text-muted-foreground border-b border-border">
                          תשובה
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {row.answers && typeof row.answers === 'object' ? (
                        Object.entries(row.answers).map(([key, value]) => (
                          <tr key={key}>
                            <td className="p-3 text-sm font-medium text-foreground border-l border-border">
                              {key}
                            </td>
                            <td className="p-3 text-sm text-muted-foreground break-words">
                              {typeof value === 'string' ? value : JSON.stringify(value)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} className="p-3 text-sm text-muted-foreground text-center">
                            אין תשובות זמינות
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-border space-y-3">
            <button
              onClick={copyAnswersToClipboard}
              className="w-full flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Copy className="h-4 w-4" />
              <span>העתק JSON</span>
            </button>
            
            <button
              onClick={exportToCSV}
              className="w-full flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>ייצוא CSV לשורה זו</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResponseDrawer;
