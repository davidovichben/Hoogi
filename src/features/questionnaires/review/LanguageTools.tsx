import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Globe, Languages, Copy, CheckCircle } from "lucide-react";
import { useToast } from "../../../hooks/use-toast";
import { useLanguage } from "../../../contexts/LanguageContext";
import { DEFAULT_META } from "../../../models/questionnaire";

interface LanguageToolsProps {
  questionnaire: any;
  questions: any[];
  primaryLanguage: string;
}

export function LanguageTools({ questionnaire, questions, primaryLanguage }: LanguageToolsProps) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [duplicatingTo, setDuplicatingTo] = useState<string>('');
  const [isDuplicating, setIsDuplicating] = useState(false);
  
  // Safe defaults for meta
  const safeMeta = questionnaire.meta || DEFAULT_META;

  const getLabel = (item: any) => {
    return typeof item.label === 'string' ? item.label : item.label[language] || item.label.en;
  };

  const languages = [
    { value: 'he', label: { he: 'עברית', en: 'Hebrew' } },
    { value: 'en', label: { he: 'English', en: 'English' } },
    { value: 'ar', label: { he: 'ערבית', en: 'Arabic' } }
  ];

  const handleDuplicateToLanguage = async (targetLanguage: string) => {
    if (targetLanguage === primaryLanguage) {
      toast({
        title: language === 'he' ? 'שגיאה' : 'Error',
        description: language === 'he' 
          ? 'לא ניתן להעתיק לשפה זהה' 
          : 'Cannot duplicate to the same language',
        variant: 'destructive'
      });
      return;
    }

    setDuplicatingTo(targetLanguage);
    setIsDuplicating(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: language === 'he' ? 'הועתק בהצלחה' : 'Duplicated successfully',
        description: language === 'he' 
          ? `השאלון הועתק לשפה ${getLabel(languages.find(l => l.value === targetLanguage))}` 
          : `Questionnaire duplicated to ${getLabel(languages.find(l => l.value === targetLanguage))}`,
      });
    } catch (error) {
      toast({
        title: language === 'he' ? 'שגיאה בהעתקה' : 'Duplication error',
        description: language === 'he' 
          ? 'לא ניתן היה להעתיק את השאלון' 
          : 'Could not duplicate questionnaire',
        variant: 'destructive'
      });
    } finally {
      setIsDuplicating(false);
      setDuplicatingTo('');
    }
  };

  const getTranslationStatus = (targetLanguage: string) => {
    if (targetLanguage === primaryLanguage) return 'primary';
    
    const hasTranslation = questions.some(q => {
      const safeQMeta = q.meta || {};
      return safeQMeta.translations?.[targetLanguage]?.title;
    });
    
    return hasTranslation ? 'translated' : 'missing';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'primary':
        return <Badge variant="default">{language === 'he' ? 'ראשי' : 'Primary'}</Badge>;
      case 'translated':
        return <Badge variant="secondary">{language === 'he' ? 'מתורגם' : 'Translated'}</Badge>;
      case 'missing':
        return <Badge variant="outline">{language === 'he' ? 'חסר' : 'Missing'}</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="h-5 w-5" />
          {language === 'he' ? 'כלי שפה' : 'Language Tools'}
        </CardTitle>
        <CardDescription>
          {language === 'he' 
            ? 'העתק שאלון לשפות נוספות ובדוק תרגומים' 
            : 'Duplicate questionnaire to additional languages and check translations'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Language */}
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4" />
            <span className="font-medium">
              {language === 'he' ? 'שפה נוכחית' : 'Current Language'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default">
              {getLabel(languages.find(l => l.value === primaryLanguage))}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {language === 'he' 
                ? 'שפה ראשית של השאלון' 
                : 'Primary questionnaire language'
              }
            </span>
          </div>
        </div>

        {/* Language Status */}
        <div className="space-y-3">
          <h4 className="font-medium">
            {language === 'he' ? 'סטטוס תרגומים' : 'Translation Status'}
          </h4>
          
          {languages.map((lang) => {
            const status = getTranslationStatus(lang.value);
            return (
              <div key={lang.value} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{getLabel(lang)}</span>
                  {getStatusBadge(status)}
                </div>
                
                {status === 'missing' && (
                  <Button
                    onClick={() => handleDuplicateToLanguage(lang.value)}
                    disabled={isDuplicating}
                    size="sm"
                    variant="outline"
                  >
                    {isDuplicating && duplicatingTo === lang.value ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2"></div>
                        {language === 'he' ? 'מעתיק...' : 'Duplicating...'}
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        {language === 'he' ? 'העתק' : 'Duplicate'}
                      </>
                    )}
                  </Button>
                )}
                
                {status === 'translated' && (
                  <Button size="sm" variant="ghost">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {language === 'he' ? 'צפה' : 'View'}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t">
          <div className="flex gap-2">
            <Button
              onClick={() => handleDuplicateToLanguage('en')}
              disabled={isDuplicating || primaryLanguage === 'en'}
              variant="outline"
              size="sm"
            >
              <Copy className="h-4 w-4 mr-2" />
              {language === 'he' ? 'העתק לאנגלית' : 'Duplicate to English'}
            </Button>
            
            <Button
              onClick={() => handleDuplicateToLanguage('ar')}
              disabled={isDuplicating || primaryLanguage === 'ar'}
              variant="outline"
              size="sm"
            >
              <Copy className="h-4 w-4 mr-2" />
              {language === 'he' ? 'העתק לערבית' : 'Duplicate to Arabic'}
            </Button>
          </div>
        </div>

        {/* Help Text */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Globe className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">
                {language === 'he' ? 'עצות לתרגום' : 'Translation Tips'}
              </p>
              <ul className="mt-1 space-y-1">
                <li>• {language === 'he' ? 'העתקה לשפה חדשה יוצרת עותק של השאלון' : 'Duplicating to a new language creates a copy of the questionnaire'}</li>
                <li>• {language === 'he' ? 'כל השאלות והאפשרויות יועתקו' : 'All questions and options will be duplicated'}</li>
                <li>• {language === 'he' ? 'תוכל לערוך את התרגומים לאחר ההעתקה' : 'You can edit translations after duplication'}</li>
                <li>• {language === 'he' ? 'השאלון המקורי נשאר ללא שינוי' : 'The original questionnaire remains unchanged'}</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
