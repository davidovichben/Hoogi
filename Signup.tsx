import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Target, Zap, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

const Signup = () => {
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

  useEffect(() => {
    document.title = "Hoogi – הרשמה";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "הרשמה ל-Hoogi – מערכת שאלונים חכמה שמקדמת סגירות");
  }, []);

  const benefits = [
    { icon: <MessageSquare className="w-7 h-7 text-primary" />, title: "כלי מכירה חכם", description: "שאלונים מעוצבים ומותאמים אישית לכל פלטפורמה." },
    { icon: <MapPin className="w-7 h-7 text-primary" />, title: "מרכז במקום אחד", description: "כל התשובות והלידים מרוכזים – פייסבוק, ווטסאפ, אתר ועוד." },
    { icon: <Target className="w-7 h-7 text-primary" />, title: "לידים חיים וממוקדים", description: "מקדמים את התהליך ומשפרים משמעותית את סיכויי הסגירה." },
    { icon: <Zap className="w-7 h-7 text-primary" />, title: "אוטומציה שעובדת בשבילך", description: "חיסכון זמן עם אוטומציות חכמות שעונות ללקוח בזמן." },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, just navigate back to main dashboard after a mock submit
    navigate("/main-dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-10 px-4 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <img src="/hoogi-new-avatar.png" alt="לוגו Hoogi" className="h-24 w-24 object-contain animate-fade-in" />
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold">
            ברוכים הבאים ל-<span className="text-primary">Hoogi</span>
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            מערכת שאלונים חכמה שמייצרת לידים חמים ומרכזת הכל במקום אחד – אוטומטית.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          {benefits.map((b, i) => (
            <div key={i} className="bg-card border border-border p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow hover-scale">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">{b.icon}</div>
                <div className="text-right">
                  <h3 className="font-semibold text-lg mb-1">{b.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="max-w-2xl mx-auto bg-card border border-border rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl md:text-2xl font-bold text-center mb-6">טופס הרשמה</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="block text-right">שם משתמש</Label>
              <Input id="username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="text-right" required />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="block text-right">מייל</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="text-right" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailConfirm" className="block text-right">אימות מייל</Label>
                <Input id="emailConfirm" type="email" value={formData.emailConfirm} onChange={(e) => setFormData({ ...formData, emailConfirm: e.target.value })} className="text-right" required />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="block text-right">סיסמה</Label>
                <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="text-right" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passwordConfirm" className="block text-right">אימות סיסמה</Label>
                <Input id="passwordConfirm" type="password" value={formData.passwordConfirm} onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })} className="text-right" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language" className="block text-right">בחירת שפה</Label>
              <Select value={formData.language} onValueChange={(v) => setFormData({ ...formData, language: v })}>
                <SelectTrigger id="language" className="text-right"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="he">עברית</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox 
                id="terms" 
                checked={formData.termsAccepted} 
                onCheckedChange={(c) => setFormData({ ...formData, termsAccepted: c as boolean })}
                required 
              />
              <Label htmlFor="terms" className="text-sm cursor-pointer">
                אני מסכים/ה ל
                <button 
                  type="button"
                  onClick={() => window.open('/terms-of-service', '_blank')}
                  className="text-primary hover:underline mx-1 font-semibold"
                >
                  תנאי השימוש והתקנון
                </button>
                <span className="text-destructive">*</span>
              </Label>
            </div>
            <div className="flex items-start gap-2">
              <Checkbox id="marketing" checked={formData.marketingAccepted} onCheckedChange={(c) => setFormData({ ...formData, marketingAccepted: c as boolean })} />
              <Label htmlFor="marketing" className="text-sm cursor-pointer">אני מסכים/ה לקבל תוכן שיווקי</Label>
            </div>

            <Button type="submit" className="w-full py-6 text-lg" disabled={!formData.termsAccepted}>
              הירשם
            </Button>

            <div className="space-y-2">
              <Button type="button" variant="outline" className="w-full py-6 text-lg" onClick={() => navigate("/login")}>
                כבר רשום/ה? התחבר/י
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
