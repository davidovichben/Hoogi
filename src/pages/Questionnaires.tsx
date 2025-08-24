import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Share2, BarChart3, Edit, Settings, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HoogiMessage } from '@/components/HoogiMascot';
import { TooltipWrapper } from '@/components/TooltipWrapper';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDemo, getDemoData } from '@/contexts/DemoContext';

// Legacy demo component – replaced by QuestionnairesList (real data)
export const Questionnaires: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { isDemoMode } = useDemo();

  const demoData = getDemoData ? getDemoData(language) : { questionnaires: [] };
  const questionnaires = isDemoMode ? demoData.questionnaires : [];

  const handleShare = (id: string, title: string) => {
    const shareUrl = `${window.location.origin}/q/${id}`;
    navigator.clipboard.writeText(shareUrl);
    // Show share modal in real app
    alert(`${t('toast.linkCopied')}\n${shareUrl}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">{t('nav.questionnaires')}</h1>
          <p className="text-muted-foreground">
            {t('builder.subtitle')}
          </p>
        </div>
        <TooltipWrapper content={t('tooltip.createQuestionnaire')}>
          <Button variant="hoogi" onClick={() => navigate('/create-questionnaire')}>
            <Plus className="h-5 w-5 mr-2" />
            {t('onboarding.title')}
          </Button>
        </TooltipWrapper>
      </div>

      {/* Hoogi Message */}
      <HoogiMessage 
        message={isDemoMode 
          ? t('hoogi.questionnairesDemo')
          : t('hoogi.questionnairesEmpty')
        }
      />

      {/* Questionnaires Grid */}
      {isDemoMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {questionnaires.map((questionnaire) => (
            <Card key={questionnaire.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{questionnaire.title}</CardTitle>
                    <CardDescription className="capitalize">{questionnaire.category}</CardDescription>
                  </div>
                  <Badge variant={questionnaire.status === 'active' ? 'default' : 'secondary'}>
                    {questionnaire.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-primary/5 rounded-lg">
                    <p className="text-2xl font-bold text-primary">{questionnaire.responses}</p>
                    <p className="text-sm text-muted-foreground">{t('responses.title')}</p>
                  </div>
                  <div className="text-center p-3 bg-secondary/5 rounded-lg">
                    <p className="text-2xl font-bold text-secondary-foreground">{questionnaire.leads}</p>
                    <p className="text-sm text-muted-foreground">{t('leads.title')}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <TooltipWrapper content={t('tooltip.shareQuestionnaire')}>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleShare(questionnaire.id, questionnaire.title)}
                    >
                      <Share2 className="h-4 w-4 mr-1" />
                      {t('common.share')}
                    </Button>
                  </TooltipWrapper>
                  
                  <TooltipWrapper content={t('tooltip.analytics')}>
                    <Button variant="outline" size="sm">
                      <BarChart3 className="h-4 w-4 mr-1" />
                      {t('analytics.title')}
                    </Button>
                  </TooltipWrapper>
                  
                  <TooltipWrapper content={t('tooltip.editQuestionnaire')}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      {t('common.edit')}
                    </Button>
                  </TooltipWrapper>
                  
                  <TooltipWrapper content={t('tooltip.questionnaireSettings')}>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-1" />
                      {t('settings.title')}
                    </Button>
                  </TooltipWrapper>
                  
                  <TooltipWrapper content={t('tooltip.preview')}>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      {t('builder.preview')}
                    </Button>
                  </TooltipWrapper>
                </div>

                {/* Conversion Rate */}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('analytics.conversionRate')}</span>
                    <span className="font-medium text-primary">
                      {Math.round((questionnaire.leads / questionnaire.responses) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mt-1">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(questionnaire.leads / questionnaire.responses) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty State */
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('onboarding.title')}</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {t('hoogi.questionnairesEmpty')}
            </p>
            <Button variant="hoogi" onClick={() => navigate('/create-questionnaire')}>
              <Plus className="h-5 w-5 mr-2" />
              {t('common.create')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};