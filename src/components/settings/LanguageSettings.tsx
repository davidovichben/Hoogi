import React from 'react';
import { Globe } from 'lucide-react';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useLanguage } from '../../contexts/LanguageContext';

export const LanguageSettings: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  const languageInfoItems = language === 'he' ? [
    '• שפת הממשק משפיעה על כל התפריטים והתוויות',
    '• ניתן ליצור שאלונים בכל שפה',
    '• תמיכה ב-RTL מופעלת אוטומטית לעברית',
    '• שפות נוספות בקרוב!'
  ] : [
    '• Interface language affects all menus and labels',
    '• Questionnaires can be created in any language',
    '• RTL support is automatically enabled for Hebrew',
    '• More languages coming soon!'
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.languageTitle')}</CardTitle>
        <CardDescription>
          {t('settings.languageSubtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="language-select" className="text-base font-medium">
              {t('settings.interfaceLanguage')}
            </Label>
            <Select value={language} onValueChange={(value: 'en' | 'he') => setLanguage(value)}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">🇺🇸 English</SelectItem>
                <SelectItem value="he">🇮🇱 עברית (Hebrew)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {t('settings.interfaceLanguageDesc')}
            </p>
          </div>
          
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold mb-3">{t('settings.languageInfo')}</h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              {languageInfoItems.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};