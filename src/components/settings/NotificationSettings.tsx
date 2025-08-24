import React from 'react';
import { Save } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Switch } from '../ui/switch';
import { TooltipWrapper } from '../TooltipWrapper';
import { useLanguage } from '../../contexts/LanguageContext';

interface NotificationData {
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyReports: boolean;
  leadAlerts: boolean;
}

interface NotificationSettingsProps {
  notifications: NotificationData;
  setNotifications: (notifications: NotificationData) => void;
  onSave: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  notifications,
  setNotifications,
  onSave
}) => {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.notificationsTitle')}</CardTitle>
        <CardDescription>
          {t('settings.notificationsSubtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <Label className="text-base font-medium">{t('settings.emailNotifications')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.emailNotificationsDesc')}
              </p>
            </div>
            <Switch 
              checked={notifications.emailNotifications}
              onCheckedChange={(checked) => 
                setNotifications({...notifications, emailNotifications: checked})
              }
            />
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <Label className="text-base font-medium">{t('settings.leadAlerts')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.leadAlertsDesc')}
              </p>
            </div>
            <Switch 
              checked={notifications.leadAlerts}
              onCheckedChange={(checked) => 
                setNotifications({...notifications, leadAlerts: checked})
              }
            />
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <Label className="text-base font-medium">{t('settings.weeklyReports')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.weeklyReportsDesc')}
              </p>
            </div>
            <Switch 
              checked={notifications.weeklyReports}
              onCheckedChange={(checked) => 
                setNotifications({...notifications, weeklyReports: checked})
              }
            />
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <Label className="text-base font-medium">{t('settings.pushNotifications')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.pushNotificationsDesc')}
              </p>
            </div>
            <Switch 
              checked={notifications.pushNotifications}
              onCheckedChange={(checked) => 
                setNotifications({...notifications, pushNotifications: checked})
              }
            />
          </div>
        </div>
        
        <div className="flex justify-end pt-4">
          <TooltipWrapper content={t('settings.savePreferencesTooltip')}>
            <Button variant="hoogi" onClick={onSave} className="w-full sm:w-auto">
              <Save className="h-4 w-4 mr-2" />
              {t('settings.savePreferences')}
            </Button>
          </TooltipWrapper>
        </div>
      </CardContent>
    </Card>
  );
};