import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Target, Zap, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HeroSectionProps {
  onGetStarted: () => void;
}

interface FormData {
  username: string;
  email: string;
  emailConfirm: string;
  password: string;
  passwordConfirm: string;
  language: string;
  termsAccepted: boolean;
  marketingAccepted: boolean;
}

const HeroSection = ({ onGetStarted }: HeroSectionProps) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    emailConfirm: "",
    password: "",
    passwordConfirm: "",
    language: "he",
    termsAccepted: false,
    marketingAccepted: false,
  });

  const benefits = [
    {
      icon: <MessageSquare className="w-8 h-8 text-primary" />,
      title: "כלי מכירה חכם",
      description: "הופכים שאלונים לכלי מכירה – מעוצבים, מקצועיים ומותאמים אישית לכל פלטפורמה."
    },
    {
      icon: <MapPin className="w-8 h-8 text-primary" />,
      title: "מרכז במקום אחד",
      description: "כל התשובות והלידים מרכזיים במקום אחד – לא משנה איפה ענו: פייסבוק, ווטסאפ, אתר או דף נחיתה."
    },
    {
      icon: <Target className="w-8 h-8 text-primary" />,
      title: "לידים חיים ומעוניינים",
      description: "לידים שמגיעים מוכנים לשיחה – מקדמים את התהליך ומאפשרים את טיקיי הסגירה."
    },
    {
      icon: <Zap className="w-8 h-8 text-primary" />,
      title: "אוטומציה שעובדת בשבילך",
      description: "חוסכים זמן ומקדמים סיגרות עם אוטומציה חכמה שענווה ללקוח ומסננת את הזמינו החשוב."
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Add validation
    onGetStarted();
  };

  return (
    <div className="w-full bg-gradient-to-b from-background to-muted/20 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Hero Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex justify-center mb-6">
            <img
              src="/hoogi-new-avatar.png"
              alt="Hoogi Avatar"
              className="h-32 object-contain animate-float"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            ברוכים הבאים ל-<span className="text-primary">Hoogi</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            מערכת שאלונים חכמה שמייצרת לידים חמים, מורכת הכל במקום אחד ומקדמת סיגרות – אוטומטית.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-card p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-border"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-3 bg-primary/10 rounded-lg">
                  {benefit.icon}
                </div>
                <div className="text-right">
                  <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Registration Form */}
        <div className="max-w-2xl mx-auto bg-card p-8 rounded-lg shadow-lg border border-border animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <h2 className="text-2xl font-bold text-center mb-6">הירשם עכשיו</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-right block">שם משתמש</Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="text-right"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-right block">מייל</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="text-right"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailConfirm" className="text-right block">עימות מייל</Label>
              <Input
                id="emailConfirm"
                type="email"
                value={formData.emailConfirm}
                onChange={(e) => setFormData({ ...formData, emailConfirm: e.target.value })}
                className="text-right"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-right block">סיסמא</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="text-right"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passwordConfirm" className="text-right block">עימות סיסמא</Label>
              <Input
                id="passwordConfirm"
                type="password"
                value={formData.passwordConfirm}
                onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                className="text-right"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language" className="text-right block">בחירת שפה</Label>
              <Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}>
                <SelectTrigger id="language" className="text-right">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="he">עברית</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start gap-2 pt-2">
              <Checkbox
                id="terms"
                checked={formData.termsAccepted}
                onCheckedChange={(checked) => setFormData({ ...formData, termsAccepted: checked as boolean })}
              />
              <Label htmlFor="terms" className="text-sm text-right cursor-pointer leading-relaxed">
                אני מסכים/ה לתנאי השימוש והתקנון
              </Label>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="marketing"
                checked={formData.marketingAccepted}
                onCheckedChange={(checked) => setFormData({ ...formData, marketingAccepted: checked as boolean })}
              />
              <Label htmlFor="marketing" className="text-sm text-right cursor-pointer leading-relaxed">
                אני מסכים/ה לקבל תוכן שיווקי
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full py-6 text-lg"
              disabled={!formData.termsAccepted}
            >
              הירשם עכשיו
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              כבר רשום/ה? <span className="text-primary cursor-pointer hover:underline" onClick={() => navigate("/login")}>התחבר/י כאן</span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
