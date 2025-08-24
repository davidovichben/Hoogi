import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";

interface ValidationPanelProps {
  questionnaire: any;
  questions: any[];
  automationSettings: any;
  selectedChannel: string;
  primaryLanguage: string;
}

export function ValidationPanel({ 
  questionnaire, 
  questions, 
  automationSettings, 
  selectedChannel, 
  primaryLanguage 
}: ValidationPanelProps) {
  const { language } = useLanguage();

  // Generate validation issues
  const issues: any[] = [];

  // Critical issues (blocking)
  if (!questionnaire.title?.trim()) {
    issues.push({
      type: 'critical',
      message: language === 'he' 
        ? 'כותרת השאלון נדרשת' 
        : 'Questionnaire title is required',
      field: 'title'
    });
  }

  if (questions.length === 0) {
    issues.push({
      type: 'critical',
      message: language === 'he' 
        ? 'נדרשת לפחות שאלה אחת' 
        : 'At least one question is required',
      field: 'questions'
    });
  }

  // Check for required questions without labels
  questions.forEach((question, index) => {
    if (question.required && !question.title?.trim()) {
      issues.push({
        type: 'critical',
        message: language === 'he' 
          ? `שאלה ${index + 1} מסומנת כחובה אך חסר לה טקסט` 
          : `Question ${index + 1} is marked as required but has no text`,
        field: `question_${index}`
      });
    }
  });

  // Warnings (non-blocking)
  // Category check removed for new schema - not required

  // Check for missing translations
  if (primaryLanguage !== 'en') {
    const hasEnglishTranslation = questions.some(q => {
      const safeQMeta = q.meta || {};
      return safeQMeta.translations?.en?.title;
    });
    if (!hasEnglishTranslation) {
      issues.push({
        type: 'warning',
        message: language === 'he' 
          ? 'חסר תרגום לאנגלית' 
          : 'Missing English translation',
        field: 'translations'
      });
    }
  }

  // Check for empty options in multiple choice questions
  questions.forEach((question, index) => {
    if (question.type === 'multi' && question.options?.length === 0) {
      issues.push({
        type: 'warning',
        message: language === 'he' 
          ? `שאלה ${index + 1} מסוג בחירה מרובה ללא אפשרויות` 
          : `Question ${index + 1} is multiple choice but has no options`,
        field: `question_${index}_options`
      });
    }
  });

  // Check for duplicate options
  questions.forEach((question, index) => {
    if (question.options?.length > 1) {
      const optionTexts = question.options.map((opt: any) => opt?.toLowerCase().trim());
      const uniqueTexts = new Set(optionTexts);
      if (optionTexts.length !== uniqueTexts.size) {
        issues.push({
          type: 'warning',
          message: language === 'he' 
            ? `שאלה ${index + 1} מכילה אפשרויות כפולות` 
            : `Question ${index + 1} contains duplicate options`,
          field: `question_${index}_options`
        });
      }
    }
  });

  // Check automation settings
  if (automationSettings?.email?.enabled && !automationSettings.email?.subject) {
    issues.push({
      type: 'warning',
      message: language === 'he' 
        ? 'אימייל אוטומטי מופעל אך חסר נושא' 
        : 'Auto-email is enabled but missing subject',
      field: 'automation_email_subject'
    });
  }

  const criticalIssues = issues.filter(issue => issue.type === 'critical');
  const warnings = issues.filter(issue => issue.type === 'warning');

  const getStatusIcon = () => {
    if (criticalIssues.length > 0) return <XCircle className="h-6 w-6 text-destructive" />;
    if (warnings.length > 0) return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
    return <CheckCircle className="h-6 w-6 text-green-600" />;
  };

  const getStatusText = () => {
    if (criticalIssues.length > 0) {
      return language === 'he' 
        ? `${criticalIssues.length} שגיאות קריטיות דורשות תיקון` 
        : `${criticalIssues.length} critical issues require fixing`;
    }
    if (warnings.length > 0) {
      return language === 'he' 
        ? `${warnings.length} אזהרות - ניתן להמשיך` 
        : `${warnings.length} warnings - can continue`;
    }
    return language === 'he' 
      ? 'השאלון מוכן לפרסום' 
      : 'Questionnaire ready for publication';
  };

  const getStatusColor = () => {
    if (criticalIssues.length > 0) return 'text-destructive';
    if (warnings.length > 0) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          {language === 'he' ? 'בדיקת תקינות' : 'Validation'}
        </CardTitle>
        <CardDescription>
          {language === 'he' 
            ? 'בדוק את תקינות השאלון לפני הפרסום' 
            : 'Check questionnaire validity before publishing'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Summary */}
        <div className={`p-4 rounded-lg border ${criticalIssues.length > 0 ? 'bg-red-50 border-red-200' : warnings.length > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <p className={`font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </p>
              <div className="flex gap-2 mt-1">
                {criticalIssues.length > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {criticalIssues.length} {language === 'he' ? 'קריטיות' : 'Critical'}
                  </Badge>
                )}
                {warnings.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {warnings.length} {language === 'he' ? 'אזהרות' : 'Warnings'}
                  </Badge>
                )}
                {criticalIssues.length === 0 && warnings.length === 0 && (
                  <Badge variant="default" className="text-xs">
                    {language === 'he' ? 'מוכן' : 'Ready'}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Issues List */}
        {issues.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">
              {language === 'he' ? 'פרטי הבעיות' : 'Issue Details'}
            </h4>
            
            {criticalIssues.map((issue, index) => (
              <div key={`critical-${index}`} className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-red-800 font-medium">{issue.message}</p>
                  {issue.field && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {issue.field}
                    </Badge>
                  )}
                </div>
              </div>
            ))}

            {warnings.map((issue, index) => (
              <div key={`warning-${index}`} className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-yellow-800 font-medium">{issue.message}</p>
                  {issue.field && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {issue.field}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Issues */}
        {issues.length === 0 && (
          <div className="text-center py-6 text-green-700">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-600" />
            <p className="font-medium">
              {language === 'he' 
                ? 'השאלון עבר את כל בדיקות התקינות בהצלחה!' 
                : 'Questionnaire passed all validation checks successfully!'
              }
            </p>
            <p className="text-sm text-green-600 mt-1">
              {language === 'he' 
                ? 'ניתן לפרסם את השאלון' 
                : 'Ready to publish'
              }
            </p>
          </div>
        )}

        {/* Help Text */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">
              {language === 'he' ? 'עצות לתקינות' : 'Validation Tips'}
            </p>
            <ul className="mt-1 space-y-1">
              <li>• {language === 'he' ? 'כותרת השאלון היא שדה חובה' : 'Questionnaire title is required'}</li>
              <li>• {language === 'he' ? 'נדרשת לפחות שאלה אחת' : 'At least one question is required'}</li>
              <li>• {language === 'he' ? 'שאלות מסומנות כחובה צריכות טקסט' : 'Required questions need text'}</li>
              <li>• {language === 'he' ? 'שאלות בחירה מרובה צריכות אפשרויות' : 'Multiple choice questions need options'}</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
