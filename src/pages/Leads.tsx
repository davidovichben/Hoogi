import React, { useState, useEffect } from 'react';
import { Phone, Mail, MessageCircle, Search, Star, Calendar, Filter } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { HoogiMessage } from '../components/HoogiMascot';
import { TooltipWrapper } from '../components/TooltipWrapper';
import { useLanguage } from '../contexts/LanguageContext';
import { useDemo, getDemoData } from '../contexts/DemoContext';
import { useToast } from '../hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const Leads: React.FC = () => {
  const { t, language } = useLanguage();
  const { isDemoMode } = useDemo();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [followUpMessage, setFollowUpMessage] = useState('');
  
  // New state for leads_flat view
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [questionnaires, setQuestionnaires] = useState<any[]>([]);
  
  // Filter states
  const [questionnaireFilter, setQuestionnaireFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [refFilter, setRefFilter] = useState<string>('');

  const demoData = getDemoData(language);
  const demoLeads = isDemoMode ? demoData.leads : [];

  const handleCall = (lead: any) => {
    window.open(`tel:${lead.phone}`);
    toast({ title: t('leads.callNow'), description: `${t('tooltip.callLead')}: ${lead.name}` });
  };

  const handleEmail = (lead: any) => {
    setSelectedLead(lead);
    setEmailSubject(language === 'he' ? `בנוגע לשאלון שלך - ${lead.name}` : `Regarding your questionnaire - ${lead.name}`);
    setEmailContent(language === 'he' ? `שלום ${lead.name},\n\nתודה על מילוי השאלון שלנו.` : `Hello ${lead.name},\n\nThank you for filling out our questionnaire.`);
    setShowEmailDialog(true);
  };

  const handleFollowUp = (lead: any) => {
    setSelectedLead(lead);
    setFollowUpMessage(language === 'he' ? `שלום ${lead.name}! תודה על מילוי השאלון.` : `Hello ${lead.name}! Thank you for filling out the questionnaire.`);
    setShowFollowUpDialog(true);
  };

  // Load leads from leads_flat view
  useEffect(() => {
    if (!isDemoMode) {
      loadLeads();
      loadQuestionnaires();
    }
  }, [isDemoMode, questionnaireFilter, monthFilter, refFilter]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('leads_flat')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (questionnaireFilter !== 'all') {
        query = query.eq('questionnaire_id', questionnaireFilter);
      }
      
      if (monthFilter !== 'all') {
        const [year, month] = monthFilter.split('-');
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0);
        query = query.gte('created_at', startDate.toISOString());
        query = query.lte('created_at', endDate.toISOString());
      }
      
      if (refFilter) {
        query = query.ilike('ref', `%${refFilter}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      setLeads(data || []);
    } catch (err: any) {
      console.error('Error loading leads:', err);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן היה לטעון את הלידים',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadQuestionnaires = async () => {
    try {
      const { data, error } = await supabase
        .from('questionnaires')
        .select('id, title')
        .order('title');
      
      if (error) throw error;
      
      setQuestionnaires(data || []);
    } catch (err) {
      console.error('Error loading questionnaires:', err);
    }
  };

  const getMonthOptions = () => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('he-IL', { year: 'numeric', month: 'long' });
      months.push({ value, label });
    }
    
    return months;
  };

  const currentLeads = isDemoMode ? demoLeads : leads;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">{t('leads.title')}</h1>
          <p className="text-muted-foreground">{t('leads.subtitle')}</p>
        </div>
      </div>

      {/* Filters Section */}
      {!isDemoMode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>סינון לידים</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>שאלון</Label>
                <Select value={questionnaireFilter} onValueChange={setQuestionnaireFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="כל השאלונים" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל השאלונים</SelectItem>
                    {questionnaires.map((q) => (
                      <SelectItem key={q.id} value={q.id}>
                        {q.title || 'ללא כותרת'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>חודש</Label>
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="כל החודשים" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל החודשים</SelectItem>
                    {getMonthOptions().map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>קוד הפניה</Label>
                <Input
                  placeholder="חפש לפי קוד הפניה..."
                  value={refFilter}
                  onChange={(e) => setRefFilter(e.target.value)}
                />
              </div>
              
              <div className="flex items-end">
                <Button onClick={loadLeads} disabled={loading}>
                  {loading ? 'טוען...' : 'עדכן סינון'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <HoogiMessage message={isDemoMode ? t('hoogi.leadsDemo') : t('hoogi.leadsEmpty')} />

      {(isDemoMode || currentLeads.length > 0) && (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>תאריך</TableHead>
                    <TableHead>{t('leads.name')}</TableHead>
                    <TableHead>{t('leads.email')}</TableHead>
                    <TableHead>{t('leads.phone')}</TableHead>
                    <TableHead>שפה</TableHead>
                    <TableHead>קוד הפניה</TableHead>
                    <TableHead>שאלון</TableHead>
                    {isDemoMode && <TableHead>{t('leads.score')}</TableHead>}
                    <TableHead>{t('responses.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            {new Date(lead.created_at).toLocaleDateString('he-IL')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{lead.name || '-'}</TableCell>
                      <TableCell>{lead.email || '-'}</TableCell>
                      <TableCell>{lead.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {lead.lang === 'he' ? 'עברית' : lead.lang === 'en' ? 'English' : lead.lang || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {lead.ref ? (
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {lead.ref}
                          </code>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {lead.questionnaire_title || 'ללא כותרת'}
                      </TableCell>
                      {isDemoMode && <TableCell>{lead.score}</TableCell>}
                      <TableCell>
                        <div className="flex gap-1">
                          {lead.phone && (
                            <TooltipWrapper content={t('tooltip.callLead')}>
                              <Button variant="ghost" size="sm" onClick={() => handleCall(lead)}>
                                <Phone className="h-4 w-4" />
                              </Button>
                            </TooltipWrapper>
                          )}
                          {lead.email && (
                            <TooltipWrapper content={t('tooltip.emailLead')}>
                              <Button variant="ghost" size="sm" onClick={() => handleEmail(lead)}>
                                <Mail className="h-4 w-4" />
                              </Button>
                            </TooltipWrapper>
                          )}
                          {lead.phone && (
                            <TooltipWrapper content={t('tooltip.followUp')}>
                              <Button variant="ghost" size="sm" onClick={() => handleFollowUp(lead)}>
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                            </TooltipWrapper>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {!isDemoMode && currentLeads.length === 0 && !loading && (
              <div className="text-center py-8">
                <p className="text-gray-600">לא נמצאו לידים התואמים לקריטריונים שנבחרו</p>
              </div>
            )}
            
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-gray-600">טוען לידים...</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('leads.sendEmailAction')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder={t('leads.emailSubject')} />
            <Textarea value={emailContent} onChange={(e) => setEmailContent(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>{t('common.cancel')}</Button>
            <Button onClick={() => { window.open(`mailto:${selectedLead?.email}?subject=${emailSubject}&body=${emailContent}`); setShowEmailDialog(false); }}>{t('leads.sendEmailAction')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Follow-up Dialog */}
      <Dialog open={showFollowUpDialog} onOpenChange={setShowFollowUpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('leads.sendFollowUp')}</DialogTitle>
          </DialogHeader>
          <Textarea value={followUpMessage} onChange={(e) => setFollowUpMessage(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFollowUpDialog(false)}>{t('common.cancel')}</Button>
            <Button onClick={() => { window.open(`https://wa.me/${selectedLead?.phone.replace(/[^0-9]/g, '')}?text=${followUpMessage}`); setShowFollowUpDialog(false); }}>{t('leads.sendMessage')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};