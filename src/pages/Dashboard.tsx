import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { HoogiMascot, HoogiMessage } from '../components/HoogiMascot';
import { TooltipWrapper } from '../components/TooltipWrapper';
import { useLanguage } from '../contexts/LanguageContext';
import { useDemo, demoData } from '../contexts/DemoContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  PlusIcon, 
  TrendingUpIcon, 
  UsersIcon, 
  MessageSquareIcon, 
  TargetIcon,
  ArrowRightIcon,
  BarChart3Icon,
  EyeIcon,
  Clipboard,
  AlertTriangleIcon,
  RefreshCwIcon
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { isDemoMode } = useDemo();
  const [showProfileAlert, setShowProfileAlert] = useState(false);
  const [profileDebug, setProfileDebug] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userStats, setUserStats] = useState({
    conversionRate: 0,
    responseRate: 0,
    activeQuestionnaires: 0,
    totalLeads: 0,
    recentQuestionnaires: []
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    // בדיקה אם הפרופיל מלא - רק פעם אחת בטעינה
    const checkProfile = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          setShowProfileAlert(true);
          return;
        }
        
        if (!user) {
          setShowProfileAlert(true);
          return;
        }

        // בדיקה מקיפה יותר של הפרופיל
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")  // בוחר את כל השדות כדי לראות מה יש
          .eq("id", user.id)
          .single();

        // שמירת מידע דיבאג לממשק
        setProfileDebug({ profile, error, user });

        // בדיקה מדויקת אם הפרופיל מלא
        let isProfileComplete = false;
        let missingFields = [];
        
        if (profile && !error) {
          // בדיקה אם יש את כל השדות הנדרשים
          // בודק גם את השדות הישנים וגם את החדשים
          const category = profile.category || profile.business_category;
          const subCategory = profile.sub_category || profile.business_subcategory;
          
          if (!category || category === null || category === undefined || category === '') {
            missingFields.push('category');
          }
          if (!subCategory || subCategory === null || subCategory === undefined || subCategory === '') {
            missingFields.push('sub_category');
          }
          
          // בדיקה נוספת - אם השדות לא ריקים אחרי trim (רק אם הם מחרוזות)
          if (typeof category === 'string' && category.trim() === '') {
            missingFields.push('category (empty after trim)');
          }
          if (typeof subCategory === 'string' && subCategory.trim() === '') {
            missingFields.push('sub_category (empty after trim)');
          }
          
          isProfileComplete = missingFields.length === 0;
        } else {
          missingFields.push('profile_not_found');
        }

        // החלטה סופית
        const shouldShowAlert = !isProfileComplete;
        setShowProfileAlert(shouldShowAlert);

        // שמירת פרופיל המשתמש
        if (profile && !error) {
          setUserProfile(profile);
        }

      } catch (error) {
        setShowProfileAlert(true);
      }
    };
    
    checkProfile();
    loadRealStats();
  }, []);

  // טעינת נתונים אמיתיים מהדאטהבייס
  const loadRealStats = async () => {
    if (isDemoMode) return;
    
    setIsLoadingStats(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // טעינת שאלונים פעילים
      const { data: questionnaires } = await supabase
        .from('questionnaires')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      // טעינת לידים
      const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id);

      // טעינת תגובות
      const { data: responses } = await supabase
        .from('responses')
        .select('*')
        .eq('user_id', user.id);

      // חישוב סטטיסטיקות
      const activeCount = questionnaires?.length || 0;
      const leadsCount = leads?.length || 0;
      const responsesCount = responses?.length || 0;

      // חישוב אחוזי המרה ותגובה (אם יש נתונים)
      const conversionRate = leadsCount > 0 ? Math.round((responsesCount / leadsCount) * 100) : 0;
      const responseRate = responsesCount > 0 ? Math.round((responsesCount / (responsesCount + leadsCount)) * 100) : 0;

      setUserStats({
        conversionRate,
        responseRate,
        activeQuestionnaires: activeCount,
        totalLeads: leadsCount,
        recentQuestionnaires: questionnaires?.slice(0, 3) || []
      });

    } catch (error) {
      console.log('Error loading stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleGoToProfile = () => {
    navigate('/profile?block=1');
  };

    const handleRefreshProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      setProfileDebug({ profile, error, user });
      
      // בדיקה מחדש
      if (profile && !error) {
        const category = profile.category || profile.business_category;
        const subCategory = profile.sub_category || profile.business_subcategory;
        
        const hasCategory = category && category !== null && category !== undefined && category !== '';
        const hasSubCategory = subCategory && subCategory !== null && subCategory !== undefined && subCategory !== '';
        
        const isComplete = hasCategory && hasSubCategory;
        setShowProfileAlert(!isComplete);
      }
    }
  };

  // שימוש בנתונים אמיתיים או דמו
  const displayStats = isDemoMode ? [
    {
      title: language === 'he' ? 'סה״כ לידים' : 'Total Leads',
      value: '1,247',
      icon: UsersIcon,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: language === 'he' ? 'שאלונים פעילים' : 'Active Questionnaires',
      value: '8',
      icon: MessageSquareIcon,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10'
    },
    {
      title: language === 'he' ? 'שיעור תגובה' : 'Response Rate',
      value: '78%',
      icon: TrendingUpIcon,
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    },
    {
      title: language === 'he' ? 'שיעור המרה' : 'Conversion Rate',
      value: '24%',
      icon: TargetIcon,
      color: 'text-orange',
      bgColor: 'bg-orange/10'
    }
  ] : [
    {
      title: language === 'he' ? 'סה״כ לידים' : 'Total Leads',
      value: userStats.totalLeads.toString(),
      icon: UsersIcon,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: language === 'he' ? 'שאלונים פעילים' : 'Active Questionnaires',
      value: userStats.activeQuestionnaires.toString(),
      icon: MessageSquareIcon,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10'
    },
    {
      title: language === 'he' ? 'שיעור תגובה' : 'Response Rate',
      value: `${userStats.responseRate}%`,
      icon: TrendingUpIcon,
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    },
    {
      title: language === 'he' ? 'שיעור המרה' : 'Conversion Rate',
      value: `${userStats.conversionRate}%`,
      icon: TargetIcon,
      color: 'text-orange',
      bgColor: 'bg-orange/10'
    }
  ];

  const displayQuestionnaires = isDemoMode ? demoData.questionnaires : userStats.recentQuestionnaires;

  return (
    <div className="space-y-6">
      {/* התראה שחובה למלא פרופיל */}
      {showProfileAlert && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertTriangleIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="mr-3">
              <h3 className="text-sm font-medium text-yellow-800">
                פרופיל לא מלא
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>חובה למלא את הפרופיל שלך לפני השימוש באפליקציה.</p>
              </div>
                                        <div className="mt-4 flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleGoToProfile}
                              className="bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
                            >
                              מעבר לפרופיל
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleRefreshProfile}
                              className="bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100"
                            >
                              <RefreshCwIcon className="h-4 w-4 mr-1" />
                              בדיקה מחדש
                            </Button>
                          </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">
            {userProfile ? 
              (language === 'he' 
                ? `ברוכים השבים, ${userProfile.full_name || userProfile.email || 'משתמש יקר'}! הנה סקירת העסק שלכם.`
                : `Welcome back, ${userProfile.full_name || userProfile.email || 'dear user'}! Here's your business overview.`
              ) : 
              (language === 'he' 
                ? 'ברוכים השבים! הנה סקירת העסק שלכם.'
                : 'Welcome back! Here\'s your business overview.'
              )
            }
          </p>
        </div>
        <div className="flex gap-2">
          <TooltipWrapper content={t('tooltip.refresh')}>
            <Button 
              variant="outline" 
              onClick={loadRealStats}
              disabled={isLoadingStats}
              className="flex items-center gap-2"
            >
              <RefreshCwIcon className={`h-4 w-4 ${isLoadingStats ? 'animate-spin' : ''}`} />
              {language === 'he' ? 'רענן' : 'Refresh'}
            </Button>
          </TooltipWrapper>
          <TooltipWrapper content={t('tooltip.createQuestionnaire')}>
            <Button 
              variant="hoogi" 
              onClick={() => navigate('/onboarding')}
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              {language === 'he' ? 'שאלון חדש' : 'New Survey'}
            </Button>
          </TooltipWrapper>
        </div>
      </div>

      {/* Welcome Message */}
      <HoogiMessage 
        message={language === 'he' 
          ? `שלום ${userProfile?.full_name ? userProfile.full_name.split(' ')[0] : 'חבר'}! הנה תמונת מצב של הפעילות שלכם. האם תרצו שאעזור לכם ליצור שאלון חדש?`
          : `Hello ${userProfile?.full_name ? userProfile.full_name.split(' ')[0] : 'friend'}! Here's an overview of your activity. Would you like me to help you create a new questionnaire?`
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <TooltipWrapper key={index} content={`${t('tooltip.viewAnalytics')} ${stat.title}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold">
                        {isLoadingStats && !isDemoMode ? (
                          <div className="flex items-center gap-2">
                            <RefreshCwIcon className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">
                              {language === 'he' ? 'טוען...' : 'Loading...'}
                            </span>
                          </div>
                        ) : (
                          stat.value
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipWrapper>
          );
        })}
      </div>

      {/* Recent Questionnaires */}
      {displayQuestionnaires.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clipboard className="h-5 w-5" />
              {t('dashboard.recentQuestionnaires')}
            </CardTitle>
            <CardDescription>
              {t('dashboard.recentQuestionnairesDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {displayQuestionnaires.map((questionnaire) => (
                <TooltipWrapper key={questionnaire.id} content={t('tooltip.viewQuestionnaire')}>
                  <div 
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/questionnaires/${questionnaire.id}`)}
                  >
                    <div className="flex-1">
                      <h3 className="font-medium">{questionnaire.title}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{questionnaire.category || questionnaire.business_category || 'כללי'}</p>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="text-center">
                        <p className="font-semibold text-foreground">{questionnaire.responses_count || 0}</p>
                        <p>{t('questionnaires.responses')}</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-foreground">{questionnaire.leads_count || 0}</p>
                        <p>{t('questionnaires.leads')}</p>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          questionnaire.status === 'active' 
                            ? 'bg-primary/10 text-primary' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {t(`questionnaires.${questionnaire.status}`)}
                        </span>
                        <Progress 
                          value={questionnaire.leads_count && questionnaire.responses_count ? 
                            (questionnaire.leads_count / questionnaire.responses_count) * 100 : 0
                          } 
                          className="w-16 h-2"
                        />
                      </div>
                    </div>
                  </div>
                </TooltipWrapper>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Empty State */
        <Card className="text-center py-12">
          <CardContent>
            <Clipboard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {language === 'he' ? 'אין שאלונים עדיין' : 'No questionnaires yet'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {language === 'he' 
                ? 'התחילו ליצור שאלונים כדי לקבל לידים ותגובות מלקוחות'
                : 'Start creating questionnaires to get leads and responses from customers'
              }
            </p>
            <Button variant="hoogi" onClick={() => navigate('/onboarding')}>
              {language === 'he' ? 'שאלון חדש' : 'New Survey'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};