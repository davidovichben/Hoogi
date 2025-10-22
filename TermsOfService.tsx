import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, FileText, Shield, Lock, AlertCircle, CheckCircle, Globe, Users, CreditCard, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermsOfService = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<'he' | 'en'>('he');

  useEffect(() => {
    document.title = language === 'he' ? "iHoogi – תנאי שימוש ותקנון" : "iHoogi – Terms of Service & Privacy Policy";
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(language === 'he' ? 'en' : 'he');
  };

  const renderHebrewContent = () => (
    <div dir="rtl">
      {/* Quick Summary */}
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <CheckCircle className="h-5 w-5 text-primary" />
            תקנון אחיד ומלא (Master Terms & Privacy Policy)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-right">
          <p className="text-sm leading-relaxed">
            ✓ תנאי שימוש (Terms of Service)
          </p>
          <p className="text-sm leading-relaxed">
            ✓ מדיניות פרטיות (Privacy Policy)
          </p>
          <p className="text-sm leading-relaxed">
            ✓ תנאי תשלום ומנויים
          </p>
          <p className="text-sm leading-relaxed">
            ✓ תנאי שותפים (Affiliate Program)
          </p>
          <p className="text-sm leading-relaxed">
            ✓ הגבלת אחריות ושיפוי משפטי
          </p>
          <p className="text-sm leading-relaxed">
            ✓ הגנה על קניין רוחני
          </p>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {/* Section 1 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <FileText className="h-5 w-5 text-primary" />
              1. כללי
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-right">
            <p className="leading-relaxed">
              מסמך זה מהווה את התקנון, תנאי השימוש ומדיניות הפרטיות של פלטפורמת <strong>iHoogi Ltd.</strong> (להלן: "החברה", "אנו", "השירות").
            </p>
            <p className="leading-relaxed">
              השימוש בשירות מהווה הסכמה מלאה ובלתי חוזרת לכל התנאים המפורטים להלן.
            </p>
            <p className="leading-relaxed">
              התקנון מחייב את המשתמשים, הלקוחות, והשותפים (Affiliates) של הפלטפורמה.
            </p>
          </CardContent>
        </Card>

        {/* Section 2 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <Shield className="h-5 w-5 text-primary" />
              2. השירות
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-right">
            <p className="leading-relaxed">
              <strong>2.1</strong> החברה מספקת מערכת SaaS לניהול לידים, יצירת שאלונים חכמים, אוטומציה, הפצה, ניתוח נתונים ותהליכי שיווק.
            </p>
            <p className="leading-relaxed">
              <strong>2.2</strong> השירות ניתן במודל מנוי חודשי/שנתי.
            </p>
            <p className="leading-relaxed">
              <strong>2.3</strong> ייתכנו עדכונים, הפסקות תחזוקה או שינויים במערכת לפי שיקול דעת החברה.
            </p>
            <p className="leading-relaxed">
              <strong>2.4</strong> החברה רשאית להוסיף, לשנות או להסיר פיצ׳רים ללא הודעה מוקדמת.
            </p>
          </CardContent>
        </Card>

        {/* Section 3 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <Users className="h-5 w-5 text-primary" />
              3. פתיחת חשבון ואחריות המשתמש
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-right">
            <p className="leading-relaxed">
              <strong>3.1</strong> המשתמש נדרש להזין פרטים מדויקים בעת ההרשמה, לרבות שם, דוא"ל ופרטי תשלום.
            </p>
            <p className="leading-relaxed">
              <strong>3.2</strong> האחריות לשמירה על סודיות פרטי הגישה היא של המשתמש בלבד.
            </p>
            <p className="leading-relaxed">
              <strong>3.3</strong> כל פעולה שתתבצע תחת החשבון תיחשב כאילו נעשתה על ידי המשתמש עצמו.
            </p>
            <p className="leading-relaxed">
              <strong>3.4</strong> החברה רשאית להשעות או לסגור חשבון במקרה של שימוש לרעה או הפרת תנאים.
            </p>
          </CardContent>
        </Card>

        {/* Section 4 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <AlertCircle className="h-5 w-5 text-primary" />
              4. שימוש מותר ואסור
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-right">
            <p className="leading-relaxed">
              <strong>4.1</strong> מותר להשתמש בשירות לצרכים עסקיים לגיטימיים בלבד.
            </p>
            <p className="leading-relaxed">
              <strong>4.2</strong> נאסר להשתמש בשירות לשם:
            </p>
            <ul className="list-disc list-inside mr-4 space-y-1">
              <li>הפצת ספאם, לשון הרע, או תכנים בלתי חוקיים</li>
              <li>איסוף מידע ללא הסכמה</li>
              <li>ניסיון פריצה, חדירה או פגיעה באבטחת המערכת</li>
              <li>שימוש בנתונים לצורך הונאה, תרמית או פגיעה באחרים</li>
            </ul>
            <p className="leading-relaxed">
              <strong>4.3</strong> הפרה תביא לסגירה מיידית של החשבון ללא החזר כספי.
            </p>
          </CardContent>
        </Card>

        {/* Section 5 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <CreditCard className="h-5 w-5 text-primary" />
              5. תשלום, מנויים והחזרים
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-right">
            <p className="leading-relaxed">
              <strong>5.1</strong> השירות ניתן בתשלום חודשי/שנתי מראש.
            </p>
            <p className="leading-relaxed">
              <strong>5.2</strong> המחירים מפורסמים באתר iHoogi וכוללים מע"מ אלא אם צוין אחרת.
            </p>
            <p className="leading-relaxed">
              <strong>5.3</strong> ביטול מנוי יתבצע דרך ממשק המשתמש. השירות יישאר פעיל עד תום התקופה ששולמה.
            </p>
            <p className="leading-relaxed">
              <strong>5.4</strong> החזר כספי יינתן רק בגין תקלה מוכחת באחריות החברה.
            </p>
            <p className="leading-relaxed">
              <strong>5.5</strong> החברה רשאית לשנות את המחירים מעת לעת.
            </p>
            <p className="leading-relaxed">
              <strong>5.6</strong> המשתמש אחראי לעמידה בדרישות המס המקומיות שלו.
            </p>
          </CardContent>
        </Card>

        {/* Section 6 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <Users className="h-5 w-5 text-primary" />
              6. תוכנית שותפים (Affiliate Program)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-right">
            <p className="leading-relaxed">
              <strong>6.1</strong> שותפים רשאים לקבל עמלות בגין לקוחות שהפנו לפלטפורמה.
            </p>
            <p className="leading-relaxed">
              <strong>6.2</strong> תשלום יתבצע אחת לחודש, לאחר אישור עסקה שלא בוטלה.
            </p>
            <p className="leading-relaxed">
              <strong>6.3</strong> החברה רשאית לשלול עמלות במקרים של פעילות פסולה, זיוף או רמאות.
            </p>
            <p className="leading-relaxed">
              <strong>6.4</strong> עמלות ישולמו לאחר ניכוי מס כחוק, באמצעות אמצעי התשלום הרשום במערכת.
            </p>
            <p className="leading-relaxed">
              <strong>6.5</strong> השותף אחראי על דיווח המס העצמאי במדינתו.
            </p>
            <p className="leading-relaxed">
              <strong>6.6</strong> אין התחייבות לתקופת שותפות, וניתן להפסיקה בכל עת על ידי החברה.
            </p>
          </CardContent>
        </Card>

        {/* Section 7 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <Lock className="h-5 w-5 text-primary" />
              7. פרטיות והגנת מידע
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-right">
            <p className="leading-relaxed">
              <strong>7.1</strong> החברה מחויבת לחוק הגנת הפרטיות הישראלי, לתקנות GDPR האירופאיות ולחוקי CCPA האמריקאיים.
            </p>
            <p className="leading-relaxed">
              <strong>7.2</strong> נאסף מידע אישי כגון: פרטי משתמש, נתוני לקוחות קצה, לידים, נתוני שימוש ופרטי תשלום.
            </p>
            <p className="leading-relaxed">
              <strong>7.3</strong> החברה נוקטת באמצעי אבטחה מתקדמים: הצפנת SSL, אימות דו-שלבי, גיבויים ובקרת גישה.
            </p>
            <p className="leading-relaxed">
              <strong>7.4</strong> הנתונים נשמרים בשרתים מאובטחים בישראל ובאיחוד האירופי.
            </p>
            <p className="leading-relaxed">
              <strong>7.5</strong> החברה לא מוכרת מידע לצדדים שלישיים.
            </p>
            <p className="leading-relaxed">
              <strong>7.6</strong> המשתמש אחראי לקבלת הסכמה חוקית ממשתמשי הקצה שלו.
            </p>
            <p className="leading-relaxed">
              <strong>7.7</strong> ניתן לבקש גישה, תיקון או מחיקה של מידע אישי דרך לשונית "צור קשר" באפליקציה.
            </p>
            <p className="leading-relaxed">
              <strong>7.8</strong> החברה עשויה להשתמש במידע אנונימי לשם שיפור השירות בלבד.
            </p>
          </CardContent>
        </Card>

        {/* Section 8 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <FileText className="h-5 w-5 text-primary" />
              8. Cookies ועיבוד נתונים
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-right">
            <p className="leading-relaxed">
              המערכת עושה שימוש בקובצי Cookies לאנליטיקות, שיפור חוויית המשתמש ושמירת הגדרות.
            </p>
            <p className="leading-relaxed">
              המשתמש רשאי לחסום קבצים אלה דרך הדפדפן, אך חלק מהשירותים עשויים שלא לפעול.
            </p>
          </CardContent>
        </Card>

        {/* Section 9 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <Shield className="h-5 w-5 text-primary" />
              9. קטינים
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-right">
            <p className="leading-relaxed">
              השירות מיועד לבגירים (מעל גיל 18). אם נאסף מידע מקטין – ניתן לפנות להסרתו.
            </p>
          </CardContent>
        </Card>

        {/* Section 10 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <FileText className="h-5 w-5 text-primary" />
              10. קניין רוחני
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-right">
            <p className="leading-relaxed">
              <strong>10.1</strong> כל הזכויות בתכני המערכת, עיצוב, קוד, לוגו וסימני המסחר שייכות ל־iHoogi Ltd.
            </p>
            <p className="leading-relaxed">
              <strong>10.2</strong> אין להעתיק, לשכפל, לפרסם, לשדר או לערוך שימוש מסחרי בתכנים ללא אישור בכתב מהחברה.
            </p>
            <p className="leading-relaxed">
              <strong>10.3</strong> תוכן שנוצר על ידי המשתמש נשאר בבעלותו, אך ניתנת לחברה רשות להשתמש בו לצורך מתן השירות.
            </p>
          </CardContent>
        </Card>

        {/* Section 11 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <Shield className="h-5 w-5 text-primary" />
              11. הגבלת אחריות ושיפוי
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-right">
            <p className="leading-relaxed">
              <strong>11.1</strong> השירות ניתן "כמות שהוא" (AS IS).
            </p>
            <p className="leading-relaxed">
              <strong>11.2</strong> החברה לא אחראית לכל נזק ישיר, עקיף, עסקי או כספי.
            </p>
            <p className="leading-relaxed">
              <strong>11.3</strong> המשתמש מתחייב לשפות את החברה בגין כל נזק, תביעה או דרישה הנובעים משימוש לא חוקי או הפרת תנאים.
            </p>
            <p className="leading-relaxed">
              <strong>11.4</strong> אחריות החברה, אם תיקבע, מוגבלת לסכום ששולם בעבור השירות בשלושים הימים האחרונים.
            </p>
          </CardContent>
        </Card>

        {/* Section 12 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <FileText className="h-5 w-5 text-primary" />
              12. שיפוט ודין
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-right">
            <p className="leading-relaxed">
              <strong>12.1</strong> תנאים אלה כפופים לדיני מדינת ישראל בלבד.
            </p>
            <p className="leading-relaxed">
              <strong>12.2</strong> סמכות השיפוט הבלעדית נתונה לבתי המשפט בתל אביב–יפו.
            </p>
            <p className="leading-relaxed">
              <strong>12.3</strong> החברה רשאית להציע יישוב סכסוכים בבוררות.
            </p>
          </CardContent>
        </Card>

        {/* Section 13 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <CheckCircle className="h-5 w-5 text-primary" />
              13. עדכוני תקנון
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-right">
            <p className="leading-relaxed">
              החברה רשאית לעדכן את התקנון ואת מדיניות הפרטיות בכל עת.
            </p>
            <p className="leading-relaxed">
              שינויים מהותיים יפורסמו בהודעה באפליקציה.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderEnglishContent = () => (
    <div dir="ltr">
      {/* Quick Summary */}
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-left">
            <CheckCircle className="h-5 w-5 text-primary" />
            Master Terms & Privacy Policy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-left">
          <p className="text-sm leading-relaxed">
            ✓ Terms of Service
          </p>
          <p className="text-sm leading-relaxed">
            ✓ Privacy Policy
          </p>
          <p className="text-sm leading-relaxed">
            ✓ Payment and Subscription Terms
          </p>
          <p className="text-sm leading-relaxed">
            ✓ Affiliate Program Terms
          </p>
          <p className="text-sm leading-relaxed">
            ✓ Liability Limitations and Legal Protection
          </p>
          <p className="text-sm leading-relaxed">
            ✓ Intellectual Property Protection
          </p>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {/* Section 1 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-left">
              <FileText className="h-5 w-5 text-primary" />
              1. General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-left">
            <p className="leading-relaxed">
              This document constitutes the unified <strong>Terms of Use, Privacy Policy, and Affiliate Terms</strong> of <strong>iHoogi Ltd.</strong> ("the Company", "we", "our", "Service").
            </p>
            <p className="leading-relaxed">
              By using the platform, you fully agree to these terms.
            </p>
            <p className="leading-relaxed">
              These terms apply to all users, clients, and affiliates.
            </p>
          </CardContent>
        </Card>

        {/* Section 2 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-left">
              <Shield className="h-5 w-5 text-primary" />
              2. The Service
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-left">
            <p className="leading-relaxed">
              <strong>2.1</strong> iHoogi provides an online SaaS platform for smart questionnaires, lead management, automation, analytics, and marketing tools.
            </p>
            <p className="leading-relaxed">
              <strong>2.2</strong> The Service is provided under monthly or annual subscriptions.
            </p>
            <p className="leading-relaxed">
              <strong>2.3</strong> The Company may modify, suspend, or update the Service at any time without prior notice.
            </p>
          </CardContent>
        </Card>

        {/* Section 3 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-left">
              <Users className="h-5 w-5 text-primary" />
              3. Account and User Responsibility
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-left">
            <p className="leading-relaxed">
              <strong>3.1</strong> Users must provide accurate registration details.
            </p>
            <p className="leading-relaxed">
              <strong>3.2</strong> Users are responsible for maintaining the confidentiality of their login information.
            </p>
            <p className="leading-relaxed">
              <strong>3.3</strong> Any activity conducted under the user's account is the user's responsibility.
            </p>
            <p className="leading-relaxed">
              <strong>3.4</strong> The Company may suspend or terminate accounts for misuse or violation of these terms.
            </p>
          </CardContent>
        </Card>

        {/* Section 4 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-left">
              <AlertCircle className="h-5 w-5 text-primary" />
              4. Permitted and Prohibited Use
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-left">
            <p className="leading-relaxed">
              <strong>4.1</strong> The Service may be used only for lawful business purposes.
            </p>
            <p className="leading-relaxed">
              <strong>4.2</strong> Prohibited uses include:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Sending spam or unlawful content</li>
              <li>Collecting data without consent</li>
              <li>Attempting to hack, damage, or access restricted areas</li>
              <li>Misusing the platform for fraud or harm</li>
            </ul>
            <p className="leading-relaxed">
              <strong>4.3</strong> Violation will result in immediate termination without refund.
            </p>
          </CardContent>
        </Card>

        {/* Section 5 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-left">
              <CreditCard className="h-5 w-5 text-primary" />
              5. Payments and Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-left">
            <p className="leading-relaxed">
              <strong>5.1</strong> Subscriptions are billed monthly or annually in advance.
            </p>
            <p className="leading-relaxed">
              <strong>5.2</strong> Prices are displayed on the iHoogi website and include VAT unless otherwise stated.
            </p>
            <p className="leading-relaxed">
              <strong>5.3</strong> Cancellations can be made through the in-app account area; service remains active until period end.
            </p>
            <p className="leading-relaxed">
              <strong>5.4</strong> Refunds are granted only for proven technical failures attributable to the Company.
            </p>
            <p className="leading-relaxed">
              <strong>5.5</strong> Prices may change with prior notice.
            </p>
          </CardContent>
        </Card>

        {/* Section 6 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-left">
              <Users className="h-5 w-5 text-primary" />
              6. Affiliate Program
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-left">
            <p className="leading-relaxed">
              <strong>6.1</strong> Affiliates may earn commissions for referred paying customers.
            </p>
            <p className="leading-relaxed">
              <strong>6.2</strong> Commissions are paid monthly after verification of valid transactions.
            </p>
            <p className="leading-relaxed">
              <strong>6.3</strong> The Company may withhold commissions in cases of fraud or violation.
            </p>
            <p className="leading-relaxed">
              <strong>6.4</strong> All payments are made net of taxes and according to local laws.
            </p>
            <p className="leading-relaxed">
              <strong>6.5</strong> Affiliates are independently responsible for tax reporting.
            </p>
            <p className="leading-relaxed">
              <strong>6.6</strong> The Company may terminate affiliate participation at any time.
            </p>
          </CardContent>
        </Card>

        {/* Section 7 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-left">
              <Lock className="h-5 w-5 text-primary" />
              7. Privacy and Data Protection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-left">
            <p className="leading-relaxed">
              <strong>7.1</strong> iHoogi complies with Israeli Privacy Law, GDPR (EU), and CCPA (US).
            </p>
            <p className="leading-relaxed">
              <strong>7.2</strong> Collected data includes user details, customer leads, usage analytics, and billing info.
            </p>
            <p className="leading-relaxed">
              <strong>7.3</strong> Data is secured using SSL encryption, 2FA, backups, and restricted access.
            </p>
            <p className="leading-relaxed">
              <strong>7.4</strong> Data is hosted on secure servers in Israel and the EU.
            </p>
            <p className="leading-relaxed">
              <strong>7.5</strong> The Company never sells personal data.
            </p>
            <p className="leading-relaxed">
              <strong>7.6</strong> Users must ensure consent from their own clients before data collection.
            </p>
            <p className="leading-relaxed">
              <strong>7.7</strong> Data access, correction, or deletion requests can be made via the in-app Contact section.
            </p>
            <p className="leading-relaxed">
              <strong>7.8</strong> Anonymized data may be used for service improvements only.
            </p>
          </CardContent>
        </Card>

        {/* Section 8 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-left">
              <FileText className="h-5 w-5 text-primary" />
              8. Cookies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-left">
            <p className="leading-relaxed">
              The platform uses cookies for analytics, personalization, and functionality.
            </p>
            <p className="leading-relaxed">
              Users can disable cookies via browser settings, though functionality may be affected.
            </p>
          </CardContent>
        </Card>

        {/* Section 9 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-left">
              <Shield className="h-5 w-5 text-primary" />
              9. Minors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-left">
            <p className="leading-relaxed">
              The Service is intended for adults (18+). If minor data is detected, it can be removed upon request.
            </p>
          </CardContent>
        </Card>

        {/* Section 10 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-left">
              <FileText className="h-5 w-5 text-primary" />
              10. Intellectual Property
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-left">
            <p className="leading-relaxed">
              <strong>10.1</strong> All IP rights in the platform, code, design, logo, and trademarks belong to iHoogi Ltd.
            </p>
            <p className="leading-relaxed">
              <strong>10.2</strong> No part of the platform may be copied, distributed, or modified without written consent.
            </p>
            <p className="leading-relaxed">
              <strong>10.3</strong> User-generated content remains user-owned, with a non-exclusive license granted to iHoogi for service delivery.
            </p>
          </CardContent>
        </Card>

        {/* Section 11 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-left">
              <Shield className="h-5 w-5 text-primary" />
              11. Limitation of Liability & Indemnification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-left">
            <p className="leading-relaxed">
              <strong>11.1</strong> The Service is provided "AS IS".
            </p>
            <p className="leading-relaxed">
              <strong>11.2</strong> The Company shall not be liable for any direct, indirect, or consequential damages.
            </p>
            <p className="leading-relaxed">
              <strong>11.3</strong> Users agree to indemnify and hold the Company harmless against claims arising from misuse or breach.
            </p>
            <p className="leading-relaxed">
              <strong>11.4</strong> The Company's total liability shall not exceed the amount paid in the 30 days prior to the incident.
            </p>
          </CardContent>
        </Card>

        {/* Section 12 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-left">
              <FileText className="h-5 w-5 text-primary" />
              12. Governing Law
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-left">
            <p className="leading-relaxed">
              <strong>12.1</strong> These terms shall be governed by the laws of the State of Israel.
            </p>
            <p className="leading-relaxed">
              <strong>12.2</strong> Exclusive jurisdiction shall rest with the courts of Tel Aviv–Yafo.
            </p>
            <p className="leading-relaxed">
              <strong>12.3</strong> The Company may offer alternative dispute resolution methods (e.g., arbitration).
            </p>
          </CardContent>
        </Card>

        {/* Section 13 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-left">
              <CheckCircle className="h-5 w-5 text-primary" />
              13. Policy Updates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-left">
            <p className="leading-relaxed">
              The Company may revise these Terms and Privacy Policy from time to time.
            </p>
            <p className="leading-relaxed">
              Major updates will be displayed within the app interface.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-gradient-to-b from-background to-muted/20 py-10 px-4`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className={`flex justify-between items-center mb-4 ${language === 'he' ? 'flex-row-reverse' : ''}`}>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(-1)}
            >
              {language === 'he' ? (
                <>
                  <ArrowRight className="ml-2 h-4 w-4" />
                  חזור
                </>
              ) : (
                <>
                  <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
                  Back
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={toggleLanguage}
              className="flex items-center gap-2"
            >
              <Globe className="h-4 w-4" />
              {language === 'he' ? 'English' : 'עברית'}
            </Button>
          </div>
          
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <img src="/hoogi-new-avatar.png" alt="iHoogi Logo" className="h-20 w-20 object-contain" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
              {language === 'he' ? '📜 תקנון ותנאי שימוש ומדיניות פרטיות – iHoogi' : '📜 Terms of Service & Privacy Policy – iHoogi'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'he' ? 'תקנון השימוש בפלטפורמת iHoogi' : 'iHoogi Platform Usage Terms'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {language === 'he' ? 'עדכון אחרון: 20 באוקטובר 2025' : 'Last updated: October 20, 2025'}
            </p>
          </div>
        </div>

        {/* Content */}
        {language === 'he' ? renderHebrewContent() : renderEnglishContent()}

        {/* Footer Actions */}
        <div className={`mt-8 flex justify-center gap-4 ${language === 'he' ? 'flex-row-reverse' : ''}`}>
          <Button 
            onClick={() => navigate(-1)}
            variant="outline"
            size="lg"
          >
            {language === 'he' ? (
              <>
                <ArrowRight className="ml-2 h-4 w-4" />
                חזרה
              </>
            ) : (
              <>
                <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
                Back
              </>
            )}
          </Button>
          <Button 
            onClick={() => navigate("/signup")}
            size="lg"
            className="flex items-center gap-2"
          >
            {language === 'he' ? 'המשך להרשמה' : 'Continue to Registration'}
            <Heart className="h-4 w-4" />
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} iHoogi Ltd. {language === 'he' ? 'כל הזכויות שמורות.' : 'All rights reserved.'}</p>
          <p className="mt-2 text-xs">
            {language === 'he' ? 'נוצר באהבה בישראל ❤️' : 'Created with love in Israel ❤️'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;