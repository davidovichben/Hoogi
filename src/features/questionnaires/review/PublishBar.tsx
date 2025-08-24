import React from "react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { Save, ArrowRight, XCircle, AlertTriangle, CheckCircle, Info, Eye, QrCode, Share2, Copy } from "lucide-react";
import { useToast } from "../../../hooks/use-toast";
import { useLanguage } from "../../../contexts/LanguageContext";

interface PublishBarProps {
  questionnaireId: string;
  criticalIssues: any[];
  warnings: any[];
  onContinue: () => void;
  onSaveDraft: () => void;
  onFinish: (e?: React.MouseEvent | React.FormEvent) => void;
  isSubmitting: boolean;
  // חדש: פונקציות לתצוגה מקדימה
  onPreview?: () => void;
  onGenerateQR?: () => void;
  onGenerateEmbed?: () => void;
  isPublished?: boolean;
  publicUrl?: string;
}

export function PublishBar({ 
  questionnaireId, 
  criticalIssues, 
  warnings, 
  onContinue, 
  onSaveDraft,
  onFinish,
  isSubmitting,
  // חדש: פונקציות לתצוגה מקדימה
  onPreview,
  onGenerateQR,
  onGenerateEmbed,
  isPublished,
  publicUrl
}: PublishBarProps) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [showIssuesDialog, setShowIssuesDialog] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Safe defaults for arrays
  const safeCriticalIssues = criticalIssues || [];
  const safeWarnings = warnings || [];

  const hasCriticalIssues = safeCriticalIssues.length > 0;
  const hasWarnings = safeWarnings.length > 0;
  const canContinue = !hasCriticalIssues;

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSaveDraft();
      
      toast({
        title: language === 'he' ? 'הטיוטה נשמרה' : 'Draft saved',
        description: language === 'he' 
          ? 'השאלון נשמר כטיוטה בהצלחה' 
          : 'Questionnaire saved as draft successfully'
      });
    } catch (error) {
      toast({
        title: language === 'he' ? 'שגיאה בשמירה' : 'Save error',
        description: language === 'he' 
          ? 'לא ניתן היה לשמור את הטיוטה' 
          : 'Could not save draft',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleContinue = () => {
    if (hasCriticalIssues) {
      setShowIssuesDialog(true);
      return;
    }

    if (hasWarnings) {
      toast({
        title: language === 'he' ? 'המשך עם אזהרות' : 'Continue with warnings',
        description: language === 'he' 
          ? 'השאלון ימשיך לשלב הבא למרות האזהרות' 
          : 'Questionnaire will continue to next stage despite warnings',
        variant: 'default'
      });
    }

    onContinue();
  };

  const getStatusIcon = () => {
    if (hasCriticalIssues) return <XCircle className="h-5 w-5 text-destructive" />;
    if (hasWarnings) return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    return <CheckCircle className="h-5 w-5 text-green-600" />;
  };

  const getStatusText = () => {
    if (hasCriticalIssues) {
      return language === 'he' 
        ? `${safeCriticalIssues.length} שגיאות קריטיות דורשות תיקון` 
        : `${safeCriticalIssues.length} critical issues require fixing`;
    }
    if (hasWarnings) {
      return language === 'he' 
        ? `${safeWarnings.length} אזהרות - ניתן להמשיך` 
        : `${safeWarnings.length} warnings - can continue`;
    }
    return language === 'he' 
      ? 'השאלון מוכן לפרסום' 
      : 'Questionnaire ready for publication';
  };

  const getStatusColor = () => {
    if (hasCriticalIssues) return 'text-destructive';
    if (hasWarnings) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <>
      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Status Info */}
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <p className={`text-sm font-medium ${getStatusColor()}`}>
                  {getStatusText()}
                </p>
                <div className="flex gap-2 mt-1">
                  {hasCriticalIssues && (
                    <Badge variant="destructive" className="text-xs">
                      {safeCriticalIssues.length} {language === 'he' ? 'קריטיות' : 'Critical'}
                    </Badge>
                  )}
                  {hasWarnings && (
                    <Badge variant="secondary" className="text-xs">
                      {safeWarnings.length} {language === 'he' ? 'אזהרות' : 'Warnings'}
                    </Badge>
                  )}
                  {!hasCriticalIssues && !hasWarnings && (
                    <Badge variant="default" className="text-xs">
                      {language === 'he' ? 'מוכן' : 'Ready'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Preview Actions */}
            {onPreview && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Info className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {language === 'he' ? 'תצוגה מקדימה לפני פרסום' : 'Preview before publishing'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={onPreview}
                    variant="outline"
                    size="sm"
                    className="text-blue-700 border-blue-300 hover:bg-blue-100"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {language === 'he' ? 'תצוגה מקדימה' : 'Preview'}
                  </Button>
                  
                  {isPublished && onGenerateQR && (
                    <Button
                      onClick={onGenerateQR}
                      variant="outline"
                      size="sm"
                      className="text-blue-700 border-blue-300 hover:bg-blue-100"
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      {language === 'he' ? 'QR Code' : 'QR Code'}
                    </Button>
                  )}
                  
                  {isPublished && onGenerateEmbed && (
                    <Button
                      onClick={onGenerateEmbed}
                      variant="outline"
                      size="sm"
                      className="text-blue-700 border-blue-300 hover:bg-blue-100"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      {language === 'he' ? 'קוד הטמעה' : 'Embed Code'}
                    </Button>
                  )}
                  
                  {isPublished && publicUrl && (
                    <Button
                      onClick={() => navigator.clipboard.writeText(publicUrl)}
                      variant="outline"
                      size="sm"
                      className="text-blue-700 border-blue-300 hover:bg-blue-100"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {language === 'he' ? 'העתק קישור' : 'Copy Link'}
                    </Button>
                  )}
                </div>
                
                {publicUrl && (
                  <div className="mt-2 text-xs text-blue-600">
                    {language === 'he' ? 'קישור ציבורי:' : 'Public link:'} {publicUrl}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSaveDraft}
                disabled={saving}
                variant="outline"
                className="gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    {language === 'he' ? 'שומר...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {language === 'he' ? 'שמור טיוטה' : 'Save Draft'}
                  </>
                )}
              </Button>

              <Button
                onClick={handleContinue}
                disabled={hasCriticalIssues}
                variant="outline"
                className="gap-2"
              >
                {language === 'he' ? 'המשך לעיצוב' : 'Continue to Design'}
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Button
                onClick={onFinish}
                disabled={hasCriticalIssues || isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    {language === 'he' ? 'מפרסם...' : 'Publishing...'}
                  </>
                ) : (
                  <>
                    {language === 'he' ? 'סיים ופרסם' : 'Finish & Publish'}
                    <CheckCircle className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          {hasCriticalIssues && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-700">
                  <Info className="h-4 w-4" />
                  <span className="text-sm">
                    {language === 'he' 
                      ? 'תקן את השגיאות הקריטיות כדי להמשיך' 
                      : 'Fix critical issues to continue'
                    }
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowIssuesDialog(true)}
                  className="text-red-700 border-red-300 hover:bg-red-100"
                >
                  {language === 'he' ? 'צפה בבעיות' : 'View Issues'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Issues Dialog */}
      <Dialog open={showIssuesDialog} onOpenChange={setShowIssuesDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              {language === 'he' ? 'בעיות שדורשות תיקון' : 'Issues Requiring Fixes'}
            </DialogTitle>
            <DialogDescription>
              {language === 'he' 
                ? 'לא ניתן להמשיך עד שתתקן את השגיאות הקריטיות הבאות:' 
                : 'Cannot continue until you fix the following critical issues:'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Critical Issues */}
            {safeCriticalIssues.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-destructive">
                  {language === 'he' 
                    ? `שגיאות קריטיות (${safeCriticalIssues.length})` 
                    : `Critical Issues (${safeCriticalIssues.length})`
                  }
                </h4>
                
                {safeCriticalIssues.map((issue, index) => (
                  <Alert key={index} variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <span>{issue.message}</span>
                        {issue.field && (
                          <Badge variant="outline" className="text-xs">
                            {issue.field}
                          </Badge>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {/* Warnings */}
            {safeWarnings.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-yellow-700">
                  {language === 'he' 
                    ? `אזהרות (${safeWarnings.length})` 
                    : `Warnings (${safeWarnings.length})`
                  }
                </h4>
                
                {safeWarnings.map((issue, index) => (
                  <Alert key={index}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <span>{issue.message}</span>
                        {issue.field && (
                          <Badge variant="outline" className="text-xs">
                            {issue.field}
                          </Badge>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={() => setShowIssuesDialog(false)}
                variant="outline"
                className="flex-1"
              >
                {language === 'he' ? 'סגור' : 'Close'}
              </Button>
              
              <Button
                onClick={handleSaveDraft}
                disabled={saving}
                variant="outline"
                className="flex-1"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    {language === 'he' ? 'שומר...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {language === 'he' ? 'שמור טיוטה' : 'Save Draft'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
