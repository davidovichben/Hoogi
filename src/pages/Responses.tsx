import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquareIcon, 
  FilterIcon, 
  SearchIcon, 
  DownloadIcon,
  EyeIcon,
  ReplyIcon,
  ArchiveIcon,
  TrashIcon,
  CalendarIcon,
  UserIcon,
  MailIcon,
  PhoneIcon
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { HoogiMessage } from '../components/HoogiMascot';
import { TooltipWrapper } from '../components/TooltipWrapper';
import { useLanguage } from '../contexts/LanguageContext';
import { useDemo, getDemoData } from '../contexts/DemoContext';

export const Responses: React.FC = () => {
  const { t, language } = useLanguage();
  const { isDemoMode } = useDemo();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const demoData = getDemoData(language);
  const responses = isDemoMode ? demoData.responses : [];

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-100';
      case 'neutral': return 'text-yellow-600 bg-yellow-100';
      case 'negative': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getLeadQualityStars = (quality: string) => {
    const stars = quality === 'high' ? 5 : quality === 'medium' ? 3 : 1;
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < stars ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'replied':
        return <Badge variant="default">Replied</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">{t('nav.responses')}</h1>
          <p className="text-muted-foreground">
            {t('responses.subtitle')}
          </p>
        </div>
      </div>

      {/* Hoogi Message */}
      <HoogiMessage 
        message={isDemoMode 
          ? t('hoogi.responsesDemo')
          : t('hoogi.responsesEmpty')
        }
      />

      {/* Filters */}
      {isDemoMode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('responses.filterResponses')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('responses.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder={t('responses.filterByStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('responses.allResponses')}</SelectItem>
                  <SelectItem value="pending">{t('responses.pending')}</SelectItem>
                  <SelectItem value="replied">{t('responses.replied')}</SelectItem>
                  <SelectItem value="scheduled">{t('responses.scheduled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Responses Table */}
      {isDemoMode ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent Responses</CardTitle>
            <CardDescription>
              Click on any response to view details and reply
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Questionnaire</TableHead>
                    <TableHead>Sentiment</TableHead>
                    <TableHead>Lead Quality</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responses.map((response) => (
                    <TableRow key={response.id} className="hover:bg-muted/50 cursor-pointer">
                      <TableCell>
                        <div>
                          <p className="font-medium">{response.clientName}</p>
                          <p className="text-sm text-muted-foreground">{response.clientEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{response.questionnaire}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSentimentColor(response.sentiment)}>
                          {response.sentiment}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getLeadQualityStars(response.leadQuality)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(response.status)}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{response.createdAt}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <TooltipWrapper content="Reply to this response">
                            <Button variant="ghost" size="sm">
                              <ReplyIcon className="h-4 w-4" />
                            </Button>
                          </TooltipWrapper>
                          
                          <TooltipWrapper content="Schedule follow-up">
                            <Button variant="ghost" size="sm">
                              <CalendarIcon className="h-4 w-4" />
                            </Button>
                          </TooltipWrapper>
                          
                          <TooltipWrapper content="View detailed analysis">
                            <Button variant="ghost" size="sm">
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                          </TooltipWrapper>
                          
                          <TooltipWrapper content="Send email">
                            <Button variant="ghost" size="sm">
                              <MailIcon className="h-4 w-4" />
                            </Button>
                          </TooltipWrapper>
                          
                          <TooltipWrapper content="Call client">
                            <Button variant="ghost" size="sm">
                              <PhoneIcon className="h-4 w-4" />
                            </Button>
                          </TooltipWrapper>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Empty State */
        <Card className="text-center py-12">
          <CardContent>
            <MessageSquareIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No responses yet</h3>
            <p className="text-muted-foreground mb-6">
              Once people start filling out your questionnaires, their responses will appear here.
            </p>
            <Button variant="hoogi" onClick={() => window.open('/questionnaires', '_blank')}>
              Share Your Questionnaires
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};