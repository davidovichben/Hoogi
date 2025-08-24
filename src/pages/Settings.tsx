import React, { useState } from 'react';
import { User, Palette, Bell, Globe } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { HoogiMessage } from '../components/HoogiMascot';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from '../hooks/use-toast';
import { ProfileSettings } from '../components/settings/ProfileSettings';
import { BrandingSettings } from '../components/settings/BrandingSettings';
import { NotificationSettings } from '../components/settings/NotificationSettings';
import { LanguageSettings } from '../components/settings/LanguageSettings';

export const Settings: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [profile, setProfile] = useState({
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '+1-555-0123',
    company: 'Acme Legal Services'
  });

  const [branding, setBranding] = useState({
    primaryColor: '#16939B',
    secondaryColor: '#FFD500',
    logoUrl: '',
    tagline: 'Your trusted legal advisor'
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    leadAlerts: true
  });

  const handleSaveProfile = () => {
    toast({
      title: t('toast.profileUpdated'),
      description: t('toast.profileUpdatedDesc')
    });
  };

  const handleSaveBranding = () => {
    toast({
      title: t('toast.brandingUpdated'),
      description: t('toast.brandingUpdatedDesc')
    });
  };

  const handleSaveNotifications = () => {
    toast({
      title: t('toast.notificationsUpdated'),
      description: t('toast.notificationsUpdatedDesc')
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">{t('settings.title')}</h1>
        <p className="text-muted-foreground">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Hoogi Message */}
      <HoogiMessage 
        message={t('hoogi.settingsMessage')}
      />

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="profile" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <User className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{t('settings.profile')}</span>
            <span className="sm:hidden">{t('settings.profile')}</span>
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <Palette className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{t('settings.branding')}</span>
            <span className="sm:hidden">{t('settings.branding')}</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{t('settings.notifications')}</span>
            <span className="sm:hidden">{t('settings.notifications')}</span>
          </TabsTrigger>
          <TabsTrigger value="language" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{t('settings.language')}</span>
            <span className="sm:hidden">{t('settings.language')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <ProfileSettings
            profile={profile}
            setProfile={setProfile}
            onSave={handleSaveProfile}
          />
        </TabsContent>

        {/* Branding Settings */}
        <TabsContent value="branding">
          <BrandingSettings
            branding={branding}
            setBranding={setBranding}
            profile={profile}
            onSave={handleSaveBranding}
          />
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <NotificationSettings
            notifications={notifications}
            setNotifications={setNotifications}
            onSave={handleSaveNotifications}
          />
        </TabsContent>

        {/* Language Settings */}
        <TabsContent value="language">
          <LanguageSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};