import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { upsertDraft } from "@/services/questionnaires";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, ArrowRight, ArrowLeft, Eye, Settings } from "lucide-react";

export default function OnboardingStep2() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const qid = params.get("qid") || undefined;

  const [questions, setQuestions] = useState<any[]>([
    {
      id: "1",
      text: "מתי אתם מתכננים לרכוש?",
      type: "single_choice",
      options: ["תוך חודש", "תוך 3 חודשים", "תוך 6 חודשים"],
      required: false
    }
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!qid) navigate("/onboarding", { replace: true });
  }, [qid, navigate]);

  // 1) שמור טיוטה → לשונית שאלונים
  async function handleSaveDraftAndGoList() {
    if (!qid) return;
    setSaving(true);
    try {
      await upsertDraft({ 
        id: qid, 
        questions, 
        status: "draft",
        title: "שאלון חדש"
      });
      navigate("/questionnaires", { replace: true });
    } catch (e) {
      console.error(e);
      alert("שגיאה בשמירת הטיוטה");
    } finally {
      setSaving(false);
    }
  }

  // 2) פרסום והפצה → סקירת שאלונים
  async function handlePublishAndGoReview() {
    if (!qid) return;
    setSaving(true);
    try {
      await upsertDraft({ 
        id: qid, 
        questions, 
        status: "ready",
        title: "שאלון חדש"
      });
      navigate(`/distribute?qid=${qid}`);
    } catch (e) {
      console.error(e);
      alert("שגיאה בהכנת השאלון לפרסום");
    } finally {
      setSaving(false);
    }
  }

  // 3) חזרה לדף הקודם
  function handleGoBack() {
    navigate("/onboarding", { replace: true });
  }

  // 4) תצוגה מקדימה
  function handlePreview() {
    if (!qid) return;
    // Redirect to new distribute route instead of old preview route
    navigate(`/distribute?qid=${qid}`);
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            יצירת שאלון - בניית שאלות
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* שאלה לדוגמה */}
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-semibold">Q4 - בחירה יחידה</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">טקסט השאלה</label>
              <input 
                type="text" 
                value={questions[0]?.text || ""}
                onChange={(e) => {
                  const newQuestions = [...questions];
                  newQuestions[0] = { ...newQuestions[0], text: e.target.value };
                  setQuestions(newQuestions);
                }}
                className="w-full p-2 border rounded-md"
                placeholder="הקלד את השאלה כאן..."
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">אפשרויות תשובה</label>
              {questions[0]?.options?.map((option, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input type="radio" name="q4" />
                  <input 
                    type="text" 
                    value={option}
                    onChange={(e) => {
                      const newQuestions = [...questions];
                      newQuestions[0].options[index] = e.target.value;
                      setQuestions(newQuestions);
                    }}
                    className="flex-1 p-2 border rounded-md"
                  />
                </div>
              ))}
              <Button variant="outline" size="sm" className="mt-2">
                + הוסף אפשרות
              </Button>
            </div>
          </div>

          {/* כפתורי פעולה */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleGoBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                קודם
              </Button>
              <Button 
                variant="outline" 
                onClick={handlePreview}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                תצוגה מקדימה
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleSaveDraftAndGoList} 
                disabled={saving}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? "שומר..." : "שמור טיוטה → שאלונים"}
              </Button>
              <Button 
                onClick={handlePublishAndGoReview} 
                disabled={saving}
                className="flex items-center gap-2"
              >
                פרסום והפצה → סקירת שאלונים
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
