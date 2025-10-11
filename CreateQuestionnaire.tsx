import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Sparkles, Users, MessageSquare, FileText, Link as LinkIcon, Upload, Eye, ArrowRight } from "lucide-react";
import { useState } from "react";
import QuestionBuilder, { Question } from "@/components/questionnaire/QuestionBuilder";
import FormPreview from "@/components/questionnaire/FormPreview";
import ChatPreview from "@/components/questionnaire/ChatPreview";
import { toast } from "sonner";

const CreateQuestionnaire = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [previewMode, setPreviewMode] = useState<'none' | 'form' | 'chat'>('none');
  const [logoFile, setLogoFile] = useState<string>("");
  const [profileFile, setProfileFile] = useState<string>("");

  // Mock data from user profile
  const businessName = "gil.arbisman";
  const subCategory = "יעוץ עסקי";
  const logoUrl = "/hoogi-new-avatar.png";

  const handleSaveQuestions = (newQuestions: Question[]) => {
    setQuestions(newQuestions);
    setIsBuilderOpen(false);
    toast.success("השאלון נשמר בהצלחה!");
  };

  const createExampleQuestionnaire = () => {
    const exampleQuestions: Question[] = [
      {
        id: "1",
        order: 1,
        title: "מה שמך המלא?",
        type: "text",
        required: true,
        placeholder: "הכנס את שמך..."
      },
      {
        id: "2",
        order: 2,
        title: "מהי כתובת האימייל שלך?",
        type: "email",
        required: true,
        placeholder: "example@email.com"
      },
      {
        id: "3",
        order: 3,
        title: "מה מספר הטלפון שלך?",
        type: "phone",
        required: true,
        placeholder: "050-1234567"
      },
      {
        id: "4",
        order: 4,
        title: "איזה שירות מעניין אותך?",
        type: "single-choice",
        required: true,
        options: ["ייעוץ עסקי", "שיווק דיגיטלי", "פיתוח אתרים", "אחר"]
      },
      {
        id: "5",
        order: 5,
        title: "אילו ערוצי תקשורת אתה משתמש?",
        type: "multiple-choice",
        required: false,
        options: ["WhatsApp", "Email", "SMS", "טלפון"]
      },
      {
        id: "6",
        order: 6,
        title: "איך היית מדרג את השירות?",
        type: "rating",
        required: true,
        minRating: 1,
        maxRating: 5
      },
      {
        id: "7",
        order: 7,
        title: "מתי תרצה לקבוע פגישה?",
        type: "date",
        required: false
      },
      {
        id: "8",
        order: 8,
        title: "ספר לנו עוד על הצרכים שלך",
        type: "text",
        required: false,
        placeholder: "כתוב כאן..."
      },
      {
        id: "9",
        order: 9,
        title: "העלה קובץ רלוונטי (אופציונלי)",
        type: "file-upload",
        required: false
      },
      {
        id: "10",
        order: 10,
        title: "הקלט הודעה קולית",
        type: "voice",
        required: false
      }
    ];
    
    setQuestions(exampleQuestions);
    setTitle("שאלון לדוגמה - כל סוגי השאלות");
    setDescription("שאלון זה מכיל דוגמאות לכל סוגי השאלות האפשריים");
    toast.success("נוצרה דוגמה עם כל סוגי השאלות!");
  };

  // Show preview if mode is active
  if (previewMode === 'form') {
    return (
      <MainLayout initialState="content">
        <div className="flex flex-col w-full min-h-screen bg-background p-4 md:p-8">
          <Button
            onClick={() => setPreviewMode('none')}
            className="mb-4 self-start"
            variant="outline"
          >
            חזור לעריכה
          </Button>
          <FormPreview
            questions={questions}
            formTitle={title || "שאלון לדוגמה"}
            formDescription={description}
            logoUrl={logoFile || logoUrl}
            profileImageUrl={profileFile}
          />
        </div>
      </MainLayout>
    );
  }

  if (previewMode === 'chat') {
    return (
      <MainLayout initialState="content">
        <div className="flex flex-col w-full min-h-screen bg-background p-4 md:p-8">
          <Button
            onClick={() => setPreviewMode('none')}
            className="mb-4 self-start"
            variant="outline"
          >
            חזור לעריכה
          </Button>
          <ChatPreview
            questions={questions}
            formTitle={title || "שאלון לדוגמה"}
            logoUrl={logoFile || logoUrl}
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout initialState="content">
      <div className="flex flex-col w-full min-h-screen bg-background p-4 md:p-8" dir="rtl">
        {/* Back Button */}
        <div className="flex items-center mb-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.history.back()}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowRight className="ml-2 h-4 w-4" />
            חזור
          </Button>
        </div>

        {/* Header with business name */}
        <div className="mb-6">
          <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
            <div className="text-center">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">
                {businessName} - {subCategory}
              </h1>
            </div>
          </div>
        </div>

        {/* Logo and Profile Picture section */}
        <div className="mb-6">
          <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
            <div className="flex items-center justify-center gap-8">
              {/* Logo section */}
              <div className="flex items-center gap-3">
                <input type="checkbox" className="w-5 h-5 text-primary" defaultChecked />
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover border-2 border-primary/20"
                />
                <span className="text-sm font-medium text-foreground">הוספת לוגו</span>
              </div>

              {/* Profile Picture section */}
              <div className="flex items-center gap-3">
                <input type="checkbox" className="w-5 h-5 text-primary" defaultChecked />
                <img
                  src={profileFile || logoUrl}
                  alt="Profile"
                  className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover border-2 border-primary/20"
                />
                <span className="text-sm font-medium text-foreground">הוספת תמונת פרופיל</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto w-full">
          {/* Main form section */}
          <div className="space-y-4 md:space-y-6 mb-6">

              {/* Title input */}
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 md:p-6 shadow-sm border border-primary/20 hover:shadow-md transition-shadow">
                <h3 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4">כותרת השאלון</h3>
                <Input
                  placeholder="הקלד כותרת..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-base"
                />
              </div>

              {/* Description input */}
              <div className="bg-card rounded-xl p-4 md:p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
                <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-foreground">תיאור השאלון</h3>
                <Textarea
                  placeholder="כתוב מילים שמסבירות בצורה כללית את השאלון..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[80px] md:min-h-[100px] text-base resize-none"
                />
              </div>

              {/* Link or Image upload */}
              <div className="bg-gradient-to-br from-secondary/5 to-secondary/10 rounded-xl p-4 md:p-6 shadow-sm border border-secondary/20 hover:shadow-md transition-shadow">
                <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-foreground">הוספת קישור / תמונה לשאלון</h3>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block text-foreground">קישור</label>
                    <Input
                      placeholder="הדבק קישור..."
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block text-foreground">העלאת תמונה</label>
                    <Input
                      type="file"
                      className="w-full"
                      accept="image/*"
                    />
                  </div>
                </div>
              </div>
          </div>

          {/* בניית השאלון - מלבן לכל הרוחב */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-6 shadow-sm border border-primary/20 hover:shadow-md transition-all cursor-pointer mb-6"
               onClick={() => setIsBuilderOpen(true)}>
            <div className="flex items-center gap-4 mb-3">
              <div className="p-4 bg-primary/20 rounded-lg">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground">בניית השאלון</h2>
                <p className="text-sm text-muted-foreground">יצירה ועריכה של שאלות לשאלון</p>
              </div>
            </div>
            {questions.length > 0 && (
              <div className="bg-primary/10 rounded-lg p-3">
                <p className="text-sm text-primary font-medium">
                  {questions.length} שאלות נוספו לשאלון
                </p>
              </div>
            )}
          </div>

          {/* Save and Distribute buttons at bottom - centered */}
          <div className="flex justify-center gap-4 mt-8 mb-4">
            <Button 
              className="bg-primary hover:bg-primary/90 text-white shadow-lg px-12 py-6 text-lg font-semibold rounded-xl"
              size="lg"
            >
              שמירה
            </Button>
            <Button 
              className="bg-secondary hover:bg-secondary/90 text-white shadow-lg px-12 py-6 text-lg font-semibold rounded-xl"
              size="lg"
              onClick={() => navigate('/distribution')}
            >
              הפצה
            </Button>
          </div>
        </div>

        {/* Question Builder Dialog */}
        <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
          <DialogContent className="max-w-4xl bg-background">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">בניית שאלון</DialogTitle>
            </DialogHeader>
            <QuestionBuilder 
              onSave={handleSaveQuestions}
              onCancel={() => setIsBuilderOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default CreateQuestionnaire;
