import React from 'react';
import { Save, Upload } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { TooltipWrapper } from '../TooltipWrapper';
import { useLanguage } from '../../contexts/LanguageContext';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Portal } from "@radix-ui/react-portal";
import { HexColorPicker } from "react-colorful";

interface BrandingData {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  tagline: string;
}

interface ProfileData {
  company: string;
}

interface BrandingSettingsProps {
  branding: BrandingData;
  setBranding: (branding: BrandingData) => void;
  profile: ProfileData;
  onSave: () => void;
}

export const BrandingSettings: React.FC<BrandingSettingsProps> = ({
  branding,
  setBranding,
  profile,
  onSave
}) => {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.brandingTitle')}</CardTitle>
        <CardDescription>
          {t('settings.brandingSubtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">{t('settings.primaryColor')}</Label>
              <div className="flex gap-2 items-center">
                <Popover modal={false}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-12 h-10 rounded shrink-0"
                      style={{ backgroundColor: branding.primaryColor }}
                    />
                  </PopoverTrigger>
                  <Portal>
                    <PopoverContent side="bottom" align="start" className="z-[1000] w-auto">
                      <HexColorPicker
                        color={branding.primaryColor}
                        onChange={(color) => setBranding({ ...branding, primaryColor: color })}
                      />
                    </PopoverContent>
                  </Portal>
                </Popover>
                <Input
                  id="primaryColor"
                  value={branding.primaryColor}
                  onChange={(e) => setBranding({...branding, primaryColor: e.target.value})}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="secondaryColor">{t('settings.secondaryColor')}</Label>
              <div className="flex gap-2 items-center">
                <Popover modal={false}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-12 h-10 rounded shrink-0"
                      style={{ backgroundColor: branding.secondaryColor }}
                    />
                  </PopoverTrigger>
                  <Portal>
                    <PopoverContent side="bottom" align="start" className="z-[1000] w-auto">
                      <HexColorPicker
                        color={branding.secondaryColor}
                        onChange={(color) => setBranding({ ...branding, secondaryColor: color })}
                      />
                    </PopoverContent>
                  </Portal>
                </Popover>
                <Input
                  id="secondaryColor"
                  value={branding.secondaryColor}
                  onChange={(e) => setBranding({...branding, secondaryColor: e.target.value})}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="logoUrl">{t('settings.logoUrl')}</Label>
              <div className="flex gap-2">
                <Input
                  id="logoUrl"
                  placeholder={t('settings.logoPlaceholder')}
                  value={branding.logoUrl}
                  onChange={(e) => setBranding({...branding, logoUrl: e.target.value})}
                  className="flex-1"
                />
                <TooltipWrapper content={t('settings.uploadLogo')}>
                  <Button variant="outline" size="icon" className="shrink-0">
                    <Upload className="h-4 w-4" />
                  </Button>
                </TooltipWrapper>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tagline">{t('settings.tagline')}</Label>
              <Textarea
                id="tagline"
                placeholder={t('settings.taglinePlaceholder')}
                value={branding.tagline}
                onChange={(e) => setBranding({...branding, tagline: e.target.value})}
                className="min-h-20"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold">{t('settings.preview')}</h4>
            <div className="p-6 border rounded-lg bg-background">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {branding.logoUrl && (
                    <img src={branding.logoUrl} alt="Logo" className="w-8 h-8 rounded" />
                  )}
                  <h5 className="font-semibold" style={{ color: branding.primaryColor }}>
                    {profile.company}
                  </h5>
                </div>
                <p className="text-sm text-muted-foreground">{branding.tagline}</p>
                <div className="space-y-2">
                  <Label>{t('settings.sampleQuestion')}</Label>
                  <Input placeholder={t('settings.sampleAnswerPlaceholder')} />
                </div>
                <Button 
                  size="sm" 
                  style={{ 
                    backgroundColor: branding.primaryColor,
                    color: 'white'
                  }}
                >
                  {t('settings.submit')}
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end pt-4">
          <TooltipWrapper content={t('settings.saveBrandingTooltip')}>
            <Button variant="hoogi" onClick={onSave} className="w-full sm:w-auto">
              <Save className="h-4 w-4 mr-2" />
              {t('settings.saveBranding')}
            </Button>
          </TooltipWrapper>
        </div>
      </CardContent>
    </Card>
  );
};