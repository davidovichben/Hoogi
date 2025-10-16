import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, User, FileText, MessageSquare, Share2, Zap, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Onboarding = () => {
  const navigate = useNavigate();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const steps = [
    {
      number: 1,
      icon: User,
      title: "צרו את הפרופיל שלכם",
      description: "ספרו לנו מי אתם, מה העסק שלכם, ומה הסגנון שמתאים לכם – ככה iHoogi תדע לבנות עבורכם חוויה שיווקית מותאמת אישית. 💡",
      bgColor: "from-blue-50 to-cyan-50",
      borderColor: "border-blue-200",
      action: () => navigate("/profile")
    },
    {
      number: 2,
      icon: FileText,
      title: "צרו שאלון חכם שמכין אתכם למכירה ממוקדת",
      description: "השאלון הופך את המתעניינים ללידים חמים – הוא שואל, ממקד ומאפשר לכם להגיע לשיחת המכירה כשאתם כבר צעד אחד קדימה. 🎯",
      bgColor: "from-purple-50 to-pink-50",
      borderColor: "border-purple-200",
      action: () => navigate("/my-hoogi")
    },
    {
      number: 3,
      icon: MessageSquare,
      title: "צרו תבנית מענה ללקוח",
      description: "הגדירו איך iHoogi תדבר בשם העסק שלכם – באופן מקצועי, אישי ואוטומטי, שמייצר אמון וחיבור אמיתי עם הלקוח. 💬",
      bgColor: "from-orange-50 to-red-50",
      borderColor: "border-orange-200",
      action: () => navigate("/create-template")
    },
    {
      number: 4,
      icon: Share2,
      title: "קבלו את הלינק שלכם לשיתוף",
      description: "בחרו איך תרצו שהלקוחות ימלאו את השאלון: כ־צ'אט אינטראקטיבי, טופס חכם, או קוד QR לסריקה – רק תבחרו, ושתפו בכל מקום שתרצו: וואטסאפ, אתר או רשתות חברתיות. 🚀",
      bgColor: "from-green-50 to-teal-50",
      borderColor: "border-green-200",
      action: () => navigate("/distribution")
    }
  ];

  const handleStepClick = (stepNumber: number, action: () => void) => {
    if (!completedSteps.includes(stepNumber)) {
      setCompletedSteps([...completedSteps, stepNumber]);
    }
    action();
  };

  const handleStart = () => {
    // Mark onboarding as completed and go to profile
    localStorage.setItem("onboarding_completed", "true");
    navigate("/profile");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20" dir="rtl">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Header with iHoogi logo */}
        <div className="text-center mb-8 md:mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary/10 flex items-center justify-center shadow-lg animate-bounce">
              <img 
                src="/hoogi-new-avatar.png" 
                alt="iHoogi Avatar" 
                className="w-16 h-16 md:w-20 md:h-20 object-contain"
              />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60 mb-4">
            ברוכים הבאים ל־iHoogi
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
            המערכת שמדברת עם הלקוחות שלכם, מתזכרת אותם,
            ומוודאת שאף ליד לא מתפספס בדרך.
            בואו נתחיל – זה קל, מהיר, וחכם. ⚡
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60 mb-6">
            ✨ הצעדים הראשונים שלכם עם iHoogi
          </h2>
        </div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 mb-8">
          {steps.map((step) => {
            const StepIcon = step.icon;
            const isCompleted = completedSteps.includes(step.number);
            
            return (
              <Card 
                key={step.number}
                className={`border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-gradient-to-l ${step.bgColor} ${step.borderColor} ${isCompleted ? 'border-primary' : 'hover:border-primary/50'}`}
                onClick={() => handleStepClick(step.number, step.action)}
              >
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-start gap-4 md:gap-6">
                    {/* Number Badge */}
                    <div className={`flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary/10 flex items-center justify-center shadow-lg relative border border-primary/20`}>
                      {isCompleted ? (
                        <CheckCircle2 className="h-6 w-6 md:h-7 md:w-7 text-primary" />
                      ) : (
                        <span className="text-primary font-bold text-xl md:text-2xl">{step.number}</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 text-right">
                      <div className="flex items-center gap-2 mb-2">
                        <StepIcon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                        <h3 className="text-xl md:text-2xl font-bold text-foreground">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                        {step.description}
                      </p>
                    </div>

                    {/* Arrow or Check */}
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        </div>
                      ) : (
                        <div className="text-2xl text-muted-foreground">←</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* How it works section */}
        <Card className="max-w-4xl mx-auto border shadow-lg bg-card/50 backdrop-blur-sm mb-8">
          <CardContent className="p-6 md:p-10 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Zap className="h-8 w-8 text-primary" />
              <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                🔁 ככה זה עובד בפשטות
              </h2>
            </div>
            <div className="text-muted-foreground leading-relaxed text-base md:text-lg max-w-3xl mx-auto mb-4">
              מילוי פרופיל → יצירת שאלון → בניית תבנית מענה ללקוח → קבלת הלינק
            </div>
            <div className="text-muted-foreground text-sm md:text-base">
              אתם מצרפים את הלקוחות –
            </div>
          </CardContent>
        </Card>

        {/* Bottom Section - "From here it's on us" */}
        <Card className="max-w-4xl mx-auto border shadow-lg bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6 md:p-10 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <MessageSquare className="h-8 w-8 text-primary" />
              <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                🤖 מכאן זה כבר עלינו
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed text-base md:text-lg max-w-3xl mx-auto">
              אנחנו נאסוף את הלידים, נרכז את כל המידע במקום אחד,
              נענה בשמכם, נתזכר את הלקוחות שלכם בדיוק ברגע הנכון –
              כדי שכל ליד יהפוך להזדמנות אמיתית. 🎯
            </p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="max-w-4xl mx-auto mt-8 flex justify-center">
          <Button
            onClick={handleStart}
            size="lg"
            className="px-12 py-6 text-xl font-bold shadow-lg hover:shadow-xl transition-all"
          >
            בואו נתחיל! 🚀
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

