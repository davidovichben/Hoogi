
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import HoogiTip from "@/components/HoogiTip";
import { CheckIcon } from "lucide-react";

const BillingForm = () => {
  const [billingInfo, setBillingInfo] = useState({
    plan: "pro",
    paymentMethod: "credit-card"
  });
  
  // Mock data
  const creditsBalance = 250;
  const activeQuestionnaires = 5;
  const leadsUsed = 120;
  const leadsRemaining = 180;

  const handlePlanChange = (value: string) => {
    setBillingInfo({
      ...billingInfo,
      plan: value
    });
  };

  const handlePaymentMethodChange = (value: string) => {
    setBillingInfo({
      ...billingInfo,
      paymentMethod: value
    });
  };

  const handleUpgrade = () => {
    toast.success(`שדרגת בהצלחה לתכנית ${billingInfo.plan}`);
  };

  const plans = [
    {
      id: "free",
      name: "חינמי",
      price: "₪0",
      period: "חודשי",
      description: "מתאים להתחלה ובדיקת המערכת",
      features: [
        "יצירת עד 5 פוסטים בחודש",
        "תמיכה בדוא\"ל בלבד",
        "אחסון של עד 100 MB"
      ]
    },
    {
      id: "basic",
      name: "בסיסי",
      price: "₪39",
      period: "חודשי",
      description: "מתאים ליחידים או חברות קטנות שרק מתחילים",
      features: [
        "יצירת עד 20 פוסטים בחודש",
        "תמיכה בדוא\"ל בלבד",
        "אחסון של עד 500 MB",
        "פיקסל מעקב אחד"
      ]
    },
    {
      id: "pro",
      name: "מקצועי",
      price: "₪99",
      period: "חודשי",
      description: "לעסקים צומחים שצריכים פתרון מקיף יותר",
      features: [
        "יצירת עד 100 פוסטים בחודש",
        "תמיכה בצ'אט ובדוא\"ל",
        "אחסון של עד 5 GB",
        "3 פיקסלי מעקב",
        "אנליטיקה מתקדמת"
      ]
    },
    {
      id: "business",
      name: "עסקי",
      price: "₪249",
      period: "חודשי", 
      description: "לארגונים גדולים עם צרכים מורכבים",
      features: [
        "יצירת פוסטים ללא הגבלה",
        "תמיכה VIP עם מנהל לקוח אישי",
        "אחסון ללא הגבלה",
        "עד 10 פיקסלי מעקב",
        "אנליטיקה מתקדמת",
        "API גישה",
        "אינטגרציה עם מערכות CRM"
      ]
    }
  ];

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-primary">{activeQuestionnaires}</div>
            <div className="text-sm text-muted-foreground mt-1">שאלונים פעילים</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-green-600">{leadsUsed}</div>
            <div className="text-sm text-muted-foreground mt-1">לידים שנוצלו</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{leadsRemaining}</div>
            <div className="text-sm text-muted-foreground mt-1">לידים נותרו</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-center">
        <HoogiTip tip="אין מנוי? הקמת מנוי תעניק לך מנהל שיווק במשרה מלאה שעובד עבורך." />
      </div>
    
      <div className="space-y-4">
        <h3 className="text-lg font-medium">תוכנית נוכחית <HoogiTip tip="פרטי התוכנית הנוכחית שלך" /></h3>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>תוכנית מקצועית</span>
              <span className="text-lg text-gray-500">₪99 / חודש</span>
            </CardTitle>
            <CardDescription>מחזור החיוב הבא: 15 ביוני, 2025</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center text-sm">
                <CheckIcon className="h-4 w-4 text-green-500 mr-2 rtl:ml-2" /> יצירת עד 100 פוסטים בחודש
              </div>
              <div className="flex items-center text-sm">
                <CheckIcon className="h-4 w-4 text-green-500 mr-2 rtl:ml-2" /> תמיכה בצ'אט ובדוא"ל
              </div>
              <div className="flex items-center text-sm">
                <CheckIcon className="h-4 w-4 text-green-500 mr-2 rtl:ml-2" /> אחסון של עד 5GB
              </div>
              <div className="flex items-center text-sm">
                <CheckIcon className="h-4 w-4 text-green-500 mr-2 rtl:ml-2" /> 3 פיקסלי מעקב
              </div>
              <div className="flex items-center text-sm">
                <CheckIcon className="h-4 w-4 text-green-500 mr-2 rtl:ml-2" /> אנליטיקה מתקדמת
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">שדרוג תוכנית <HoogiTip tip="בחר תוכנית חדשה לשדרוג" /></h3>
        
        <RadioGroup 
          value={billingInfo.plan} 
          onValueChange={handlePlanChange}
          className="space-y-3"
        >
          {plans.map((plan) => (
            <div key={plan.id} className="relative">
              <RadioGroupItem
                value={plan.id}
                id={`plan-${plan.id}`}
                className="sr-only"
              />
              <Label
                htmlFor={`plan-${plan.id}`}
                className={`
                  flex items-start gap-4 p-4 rounded-lg border-2 transition-colors cursor-pointer
                  ${billingInfo.plan === plan.id ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white hover:bg-gray-50'}
                `}
              >
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-bold text-xl">{plan.name}</span>
                    <span className="text-2xl font-bold">{plan.price}</span>
                    <span className="text-gray-500">/{plan.period}</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{plan.description}</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm">
                        <CheckIcon className="h-4 w-4 text-green-500 mr-2 rtl:ml-2" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">חבילות לידים נוספות</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-xl">חבילת לידים למייל</CardTitle>
                <div className="text-3xl font-bold text-primary">₪199</div>
              </div>
              <CardDescription>קבל לידים נוספים דרך מייל בלבד</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-primary mb-1">100</div>
                <p className="text-sm text-muted-foreground">לידים נוספים</p>
              </div>
              <ul className="space-y-2">
                <li className="flex items-center text-sm">
                  <CheckIcon className="h-4 w-4 text-green-500 ml-2" />
                  <span>מסירה מיידית למייל</span>
                </li>
                <li className="flex items-center text-sm">
                  <CheckIcon className="h-4 w-4 text-green-500 ml-2" />
                  <span>תוקף של 6 חודשים</span>
                </li>
                <li className="flex items-center text-sm">
                  <CheckIcon className="h-4 w-4 text-green-500 ml-2" />
                  <span>ללא עלויות נסתרות</span>
                </li>
              </ul>
              <Button className="w-full" size="lg" onClick={() => toast.success("החבילה נרכשה בהצלחה!")}>
                קנה חבילה
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/30 hover:border-primary transition-colors relative">
            <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">מומלץ</div>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-xl">חבילת לידים מורחבת</CardTitle>
                <div className="text-3xl font-bold text-primary">₪299</div>
              </div>
              <CardDescription>קבל לידים דרך מייל וגם דרך WhatsApp</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-primary mb-1">100</div>
                <p className="text-sm text-muted-foreground">לידים נוספים</p>
              </div>
              <ul className="space-y-2">
                <li className="flex items-center text-sm">
                  <CheckIcon className="h-4 w-4 text-green-500 ml-2" />
                  <span>מסירה מיידית למייל</span>
                </li>
                <li className="flex items-center text-sm">
                  <CheckIcon className="h-4 w-4 text-green-500 ml-2" />
                  <span>התראות WhatsApp בזמן אמת</span>
                </li>
                <li className="flex items-center text-sm">
                  <CheckIcon className="h-4 w-4 text-green-500 ml-2" />
                  <span>תוקף של 6 חודשים</span>
                </li>
                <li className="flex items-center text-sm">
                  <CheckIcon className="h-4 w-4 text-green-500 ml-2" />
                  <span>עדיפות בתמיכה</span>
                </li>
              </ul>
              <Button className="w-full" size="lg" onClick={() => toast.success("החבילה נרכשה בהצלחה!")}>
                קנה חבילה
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">תוכנית שותפים</h3>
        <Card>
          <CardHeader>
            <CardTitle>הצטרף לתוכנית השותפים שלנו</CardTitle>
            <CardDescription>הרוויח עמלה על כל לקוח שתפנה אלינו</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-4">
              <li className="flex items-start text-sm">
                <CheckIcon className="h-4 w-4 text-green-500 ml-2 mt-0.5" />
                <span>קבל 20% עמלה חוזרת מכל לקוח שתפנה</span>
              </li>
              <li className="flex items-start text-sm">
                <CheckIcon className="h-4 w-4 text-green-500 ml-2 mt-0.5" />
                <span>פאנל ניהול מתקדם לעקוב אחר ההכנסות</span>
              </li>
              <li className="flex items-start text-sm">
                <CheckIcon className="h-4 w-4 text-green-500 ml-2 mt-0.5" />
                <span>חומרי שיווק ותמיכה ייעודית</span>
              </li>
            </ul>
            <Button className="w-full" onClick={() => toast.success("בקשתך התקבלה! ניצור איתך קשר בקרוב")}>
              הצטרף לתוכנית
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">אמצעי תשלום <HoogiTip tip="בחר את אמצעי התשלום" /></h3>
        <Card>
          <CardContent className="pt-6">
            <RadioGroup 
              value={billingInfo.paymentMethod} 
              onValueChange={handlePaymentMethodChange}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <RadioGroupItem value="credit-card" id="payment-cc" />
                <Label htmlFor="payment-cc" className="flex-1 cursor-pointer">
                  כרטיס אשראי
                  <p className="text-sm text-gray-500">Visa •••• 4242</p>
                </Label>
                <Button variant="outline" size="sm" onClick={() => toast.info("עדכון פרטי כרטיס יהיה זמין בקרוב")}>
                  עדכון
                </Button>
              </div>
              
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <RadioGroupItem value="paypal" id="payment-paypal" />
                <Label htmlFor="payment-paypal" className="flex-1 cursor-pointer">
                  PayPal
                  <p className="text-sm text-gray-500">example@email.com</p>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <RadioGroupItem value="bank" id="payment-bank" />
                <Label htmlFor="payment-bank" className="flex-1 cursor-pointer">
                  העברה בנקאית
                  <p className="text-sm text-gray-500">קבל פרטי חשבון להעברה בנקאית</p>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleUpgrade}>שדרג מנוי</Button>
      </div>
    </div>
  );
};

export default BillingForm;
