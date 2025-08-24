import React from 'react';
import { Save } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { TooltipWrapper } from '../TooltipWrapper';
import { useLanguage } from '../../contexts/LanguageContext';

interface ProfileData {
  fullName: string;
  email: string;
  phone: string;
  company: string;
}

interface ProfileSettingsProps {
  profile: ProfileData;
  setProfile: (profile: ProfileData) => void;
  onSave: () => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  profile,
  setProfile,
  onSave
}) => {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.profileTitle')}</CardTitle>
        <CardDescription>
          {t('settings.profileSubtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">{t('settings.fullName')}</Label>
            <Input
              id="fullName"
              value={profile.fullName}
              onChange={(e) => setProfile({...profile, fullName: e.target.value})}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({...profile, email: e.target.value})}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t('settings.phone')}</Label>
            <Input
              id="phone"
              value={profile.phone}
              onChange={(e) => setProfile({...profile, phone: e.target.value})}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">{t('settings.company')}</Label>
            <Input
              id="company"
              value={profile.company}
              onChange={(e) => setProfile({...profile, company: e.target.value})}
              className="w-full"
            />
          </div>
        </div>
        
        <div className="flex justify-end pt-4">
          <TooltipWrapper content={t('settings.saveProfileTooltip')}>
            <Button variant="hoogi" onClick={onSave} className="w-full sm:w-auto">
              <Save className="h-4 w-4 mr-2" />
              {t('settings.saveProfile')}
            </Button>
          </TooltipWrapper>
        </div>
      </CardContent>
    </Card>
  );
};