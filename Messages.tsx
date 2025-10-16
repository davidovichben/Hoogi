import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Eye, MessageSquare, AlertTriangle, CheckCircle, Info, Lightbulb, BookOpen, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface SystemMessage {
  id: string;
  type: string;
  title: string;
  description: string;
  content: string;
  category: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  usage: string;
  variables: string[];
}

const Messages = () => {
  const [selectedMessage, setSelectedMessage] = useState<SystemMessage | null>(null);

  // הודעות מערכת למשתמש
  const systemMessages: SystemMessage[] = [
    // הודעות חובה
    {
      id: "required-fields",
      type: "required",
      title: "שדות חובה",
      description: "הודעה כאשר משתמש לא מילא שדות חובה",
      content: `נא למלא את השדות החובה: {{missingField1}}, {{missingField2}}, {{missingField3}}`,
      category: "required",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "from-red-50 to-red-100",
      borderColor: "border-red-200",
      usage: "כאשר משתמש לא מילא שדות חובה",
      variables: ["missingField1", "missingField2", "missingField3"]
    },
    {
      id: "field-required",
      type: "required",
      title: "שדה חובה",
      description: "הודעה עבור שדה ספציפי שחסר",
      content: `השדה "{{fieldName}}" הוא חובה ולא ניתן להמשיך בלעדיו`,
      category: "required",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "from-red-50 to-red-100",
      borderColor: "border-red-200",
      usage: "שדה ספציפי שחסר",
      variables: ["fieldName"]
    },

    // הודעות שמירה
    {
      id: "save-success",
      type: "save",
      title: "נשמר בהצלחה",
      description: "הודעה כאשר נתונים נשמרו בהצלחה",
      content: `הנתונים שלך נשמרו בהצלחה! ✅`,
      category: "save",
      icon: Save,
      color: "text-green-600",
      bgColor: "from-green-50 to-green-100",
      borderColor: "border-green-200",
      usage: "אחרי שמירה מוצלחת",
      variables: []
    },
    {
      id: "auto-save",
      type: "save",
      title: "שמירה אוטומטית",
      description: "הודעה על שמירה אוטומטית של נתונים",
      content: `שמרתי את הנתונים שלך אוטומטית! 💾`,
      category: "save",
      icon: Save,
      color: "text-green-600",
      bgColor: "from-green-50 to-green-100",
      borderColor: "border-green-200",
      usage: "שמירה אוטומטית",
      variables: []
    },

    // הודעות התראה
    {
      id: "attention",
      type: "warning",
      title: "שים לב",
      description: "הודעה חשובה שמחייבת תשומת לב",
      content: `שים לב: {{importantMessage}}`,
      category: "warning",
      icon: AlertCircle,
      color: "text-orange-600",
      bgColor: "from-orange-50 to-orange-100",
      borderColor: "border-orange-200",
      usage: "הודעה חשובה שמחייבת תשומת לב",
      variables: ["importantMessage"]
    },
    {
      id: "system-maintenance",
      type: "warning",
      title: "תחזוקה",
      description: "הודעה על תחזוקה מתוכננת",
      content: `המערכת תהיה בתחזוקה ב-{{maintenanceDate}} בין השעות {{startTime}} ל-{{endTime}}`,
      category: "warning",
      icon: AlertCircle,
      color: "text-orange-600",
      bgColor: "from-orange-50 to-orange-100",
      borderColor: "border-orange-200",
      usage: "תחזוקה מתוכננת",
      variables: ["maintenanceDate", "startTime", "endTime"]
    },

    // הודעות המלצה
    {
      id: "recommendation",
      type: "recommendation",
      title: "מומלץ",
      description: "המלצה חכמה לשיפור התוצאות",
      content: `מומלץ: {{recommendation}}`,
      category: "recommendation",
      icon: Lightbulb,
      color: "text-yellow-600",
      bgColor: "from-yellow-50 to-yellow-100",
      borderColor: "border-yellow-200",
      usage: "המלצה חכמה",
      variables: ["recommendation"]
    },
    {
      id: "tip",
      type: "recommendation",
      title: "טיפ",
      description: "טיפ שימושי למשתמש",
      content: `טיפ: {{tip}}`,
      category: "recommendation",
      icon: Lightbulb,
      color: "text-yellow-600",
      bgColor: "from-yellow-50 to-yellow-100",
      borderColor: "border-yellow-200",
      usage: "טיפ שימושי",
      variables: ["tip"]
    },
    {
      id: "business-details",
      type: "recommendation",
      title: "פרטי עסק",
      description: "המלצה למלא פרטי עסק",
      content: `טיפ: מלאי כאן את פרטי העסק כדי שה-AI יתאים עבורך תכנים מדויקים יותר`,
      category: "recommendation",
      icon: Lightbulb,
      color: "text-yellow-600",
      bgColor: "from-yellow-50 to-yellow-100",
      borderColor: "border-yellow-200",
      usage: "המלצה למלא פרטי עסק",
      variables: []
    },

    // הודעות הדרכה
    {
      id: "guide",
      type: "guide",
      title: "הדרכה",
      description: "הסבר על אופן פעולת המערכת",
      content: `איך זה עובד: {{explanation}}`,
      category: "guide",
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "from-blue-50 to-blue-100",
      borderColor: "border-blue-200",
      usage: "הסבר על אופן פעולה",
      variables: ["explanation"]
    },
    {
      id: "tutorial",
      type: "guide",
      title: "מדריך",
      description: "מדריך צעד אחר צעד",
      content: `מדריך: {{tutorialSteps}}`,
      category: "guide",
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "from-blue-50 to-blue-100",
      borderColor: "border-blue-200",
      usage: "מדריך צעד אחר צעד",
      variables: ["tutorialSteps"]
    },

    // הודעות מידע
    {
      id: "info",
      type: "info",
      title: "מידע",
      description: "מידע חשוב למשתמש",
      content: `מידע: {{information}}`,
      category: "info",
      icon: Info,
      color: "text-cyan-600",
      bgColor: "from-cyan-50 to-cyan-100",
      borderColor: "border-cyan-200",
      usage: "מידע חשוב",
      variables: ["information"]
    },
    {
      id: "update",
      type: "info",
      title: "עדכון",
      description: "הודעה על עדכון חדש",
      content: `עדכון: {{updateContent}}`,
      category: "info",
      icon: Info,
      color: "text-cyan-600",
      bgColor: "from-cyan-50 to-cyan-100",
      borderColor: "border-cyan-200",
      usage: "עדכון חדש",
      variables: ["updateContent"]
    }
  ];

  const categories = [
    { id: "all", label: "כל ההודעות", icon: MessageSquare },
    { id: "required", label: "חובה", icon: AlertTriangle, color: "text-red-600" },
    { id: "save", label: "שמירה", icon: Save, color: "text-green-600" },
    { id: "warning", label: "התראה", icon: AlertCircle, color: "text-orange-600" },
    { id: "recommendation", label: "המלצה", icon: Lightbulb, color: "text-yellow-600" },
    { id: "guide", label: "הדרכה", icon: BookOpen, color: "text-blue-600" },
    { id: "info", label: "מידע", icon: Info, color: "text-cyan-600" }
  ];

  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredMessages = selectedCategory === "all" 
    ? systemMessages 
    : systemMessages.filter(message => message.category === selectedCategory);

  const handleCopyMessage = (message: SystemMessage) => {
    navigator.clipboard.writeText(message.content);
    toast.success("ההודעה הועתקה ללוח", {
      description: `"${message.title}" הועתק בהצלחה`
    });
  };

  const handlePreviewMessage = (message: SystemMessage) => {
    setSelectedMessage(message);
  };

  const renderMessageCard = (message: SystemMessage) => {
    const IconComponent = message.icon;
    
    return (
      <Card key={message.id} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${message.bgColor} border ${message.borderColor}`}>
                <IconComponent className={`h-5 w-5 ${message.color}`} />
              </div>
              <div>
                <CardTitle className="text-lg">{message.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{message.description}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {message.usage}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className={`bg-gradient-to-r ${message.bgColor} border ${message.borderColor} rounded-lg p-3 mb-4`}>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  {message.content}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 flex-shrink-0">
                <img 
                  src="/hoogi-new-avatar.png" 
                  alt="iHoogi" 
                  className="w-8 h-8 object-contain"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {message.variables.slice(0, 3).map((variable, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {`{{${variable}}}`}
                </Badge>
              ))}
              {message.variables.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{message.variables.length - 3} עוד
                </Badge>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreviewMessage(message)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyMessage(message)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-4">
            💬 הודעות מערכת
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            אוסף של הודעות מערכת מוכנות לשימוש - הודעות חובה, שמירה, התראה, המלצות והדרכה
          </p>
        </div>

        {/* Categories */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-7 gap-2">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="hidden sm:inline">{category.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMessages.map(renderMessageCard)}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Preview Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${selectedMessage.bgColor} border ${selectedMessage.borderColor}`}>
                  <selectedMessage.icon className={`h-5 w-5 ${selectedMessage.color}`} />
                </div>
                <div>
                  <CardTitle>{selectedMessage.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{selectedMessage.description}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedMessage(null)}
              >
                ✕
              </Button>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Preview with iHoogi styling */}
              <div className={`bg-gradient-to-r ${selectedMessage.bgColor} border ${selectedMessage.borderColor} rounded-lg p-4`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      {selectedMessage.content}
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 flex-shrink-0">
                    <img 
                      src="/hoogi-new-avatar.png" 
                      alt="iHoogi" 
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {selectedMessage.variables.map((variable, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {`{{${variable}}}`}
                  </Badge>
                ))}
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleCopyMessage(selectedMessage)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  העתק הודעה
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Messages;