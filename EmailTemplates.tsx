import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Save, Eye, Send, Copy, Edit, Plus, Trash2 } from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  type: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
  isActive: boolean;
}

const EmailTemplates = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    type: "",
    subject: "",
    htmlContent: "",
    textContent: "",
    variables: [] as string[]
  });

  // Load templates on component mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    // Default email templates
    const defaultTemplates: EmailTemplate[] = [
      {
        id: "1",
        name: "אישור הרשמה",
        type: "registration",
        subject: "ברוכים הבאים ל-iHoogi! 🎉",
        htmlContent: `
          <!DOCTYPE html>
          <html dir="rtl" lang="he">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: white; border-radius: 20px; padding: 0; box-shadow: 0 20px 60px rgba(0,0,0,0.2); overflow: hidden;">
                
                <!-- Header with iHoogi Avatar -->
                <div style="background: linear-gradient(135deg, #2D66F2 0%, #1e40af 100%); padding: 40px 30px; text-align: center; position: relative;">
                  <div style="display: inline-block; position: relative;">
                    <img src="/hoogi-new-avatar.png" alt="iHoogi" style="width: 100px; height: 100px; border-radius: 50%; border: 5px solid white; box-shadow: 0 8px 20px rgba(0,0,0,0.2); background: white;">
                    <div style="position: absolute; bottom: -5px; right: -5px; background: #10b981; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white;">
                      <span style="font-size: 16px;">👋</span>
                    </div>
                  </div>
                  <h1 style="color: white; font-size: 32px; margin: 20px 0 0 0; font-weight: 700; text-shadow: 0 2px 10px rgba(0,0,0,0.1);">ברוכים הבאים ל-iHoogi!</h1>
                  <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 10px 0 0 0;">הפלטפורמה החכמה ליצירת שאלונים 🚀</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px; direction: rtl; text-align: right;">
                  <p style="font-size: 20px; margin-bottom: 15px; color: #1f2937; font-weight: 600;">היי {{userName}},</p>
                  <p style="font-size: 16px; margin-bottom: 25px; color: #4b5563; line-height: 1.6;">תודה רבה שהצטרפתם אלינו! 🎉 החשבון שלכם נוצר בהצלחה ו-iHoogi מוכן לעזור לכם ליצור שאלונים מדהימים.</p>
                  
                  <!-- Info Box -->
                  <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-right: 5px solid #2D66F2; padding: 25px; border-radius: 15px; margin: 30px 0; box-shadow: 0 4px 15px rgba(45, 102, 242, 0.1);">
                    <div style="display: flex; align-items: center; margin-bottom: 15px;">
                      <span style="font-size: 32px; margin-left: 15px;">👤</span>
                      <h3 style="color: #1e40af; margin: 0; font-size: 20px; font-weight: 700;">פרטי החשבון שלך</h3>
                    </div>
                    <div style="background: white; padding: 15px; border-radius: 10px; margin-top: 15px;">
                      <p style="margin: 8px 0; color: #374151; font-size: 15px;"><strong style="color: #2D66F2;">📧 אימייל:</strong> {{userEmail}}</p>
                      <p style="margin: 8px 0; color: #374151; font-size: 15px;"><strong style="color: #2D66F2;">📅 תאריך הרשמה:</strong> {{registrationDate}}</p>
                    </div>
                  </div>
                  
                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 40px 0;">
                    <a href="{{loginLink}}" style="background: linear-gradient(135deg, #2D66F2 0%, #1e40af 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 30px; font-weight: 700; font-size: 18px; display: inline-block; box-shadow: 0 10px 30px rgba(45, 102, 242, 0.4); transition: transform 0.2s;">
                      🚀 התחל ליצור שאלונים עכשיו
                    </a>
                  </div>
                  
                  <!-- Tips Box -->
                  <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-right: 5px solid #f59e0b; padding: 20px; border-radius: 15px; margin: 30px 0;">
                    <p style="margin: 0; color: #92400e; font-size: 15px; line-height: 1.6;">
                      <strong style="font-size: 16px;">💡 טיפ מ-iHoogi:</strong><br>
                      התחילו עם שאלון פשוט ותראו איך iHoogi עוזר לכם לקבל תובנות מדהימות מהתגובות! 
                    </p>
                  </div>
                  
                  <p style="font-size: 15px; color: #6b7280; margin-top: 30px; text-align: center; line-height: 1.6;">
                    יש לכם שאלות? iHoogi כאן בשבילכם! 💬<br>
                    פשוט שלחו הודעה ואנחנו נשמח לעזור.
                  </p>
                </div>
                
                <!-- Footer -->
                <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-top: 2px solid #e5e7eb; padding: 30px; text-align: center;">
                  <div style="margin-bottom: 15px;">
                    <a href="{{supportLink}}" style="color: #2D66F2; text-decoration: none; margin: 0 15px; font-size: 14px; font-weight: 600;">📞 תמיכה</a>
                    <a href="{{privacyLink}}" style="color: #2D66F2; text-decoration: none; margin: 0 15px; font-size: 14px; font-weight: 600;">🔒 פרטיות</a>
                  </div>
                  <p style="color: #9ca3af; font-size: 13px; margin: 10px 0 0 0;">© 2024 iHoogi - הפלטפורמה החכמה ליצירת שאלונים. כל הזכויות שמורות.</p>
                  <p style="color: #d1d5db; font-size: 12px; margin: 5px 0 0 0;">נוצר עם ❤️ על ידי צוות iHoogi</p>
                </div>
                
              </div>
            </div>
          </body>
          </html>
        `,
        textContent: `
          ברוכים הבאים ל-iHoogi!
          
          שלום {{userName}},
          
          תודה שהצטרפתם אלינו! החשבון שלכם נוצר בהצלחה.
          
          פרטי החשבון שלך:
          - אימייל: {{userEmail}}
          - תאריך הרשמה: {{registrationDate}}
          
          התחל ליצור שאלונים: {{loginLink}}
          
          אם יש לכם שאלות, iHoogi כאן לעזור!
          
          © 2024 iHoogi. כל הזכויות שמורות.
        `,
        variables: ["userName", "userEmail", "registrationDate", "loginLink", "supportLink", "privacyLink"],
        isActive: true
      },
      {
        id: "2",
        name: "איפוס סיסמה",
        type: "password-reset",
        subject: "איפוס סיסמה - iHoogi",
        htmlContent: `
          <!DOCTYPE html>
          <html dir="rtl" lang="he">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #f43f5e 0%, #be123c 100%);">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: white; border-radius: 20px; padding: 0; box-shadow: 0 20px 60px rgba(0,0,0,0.2); overflow: hidden;">
                
                <!-- Header with iHoogi Avatar -->
                <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 40px 30px; text-align: center; position: relative;">
                  <div style="display: inline-block; position: relative;">
                    <img src="/hoogi-new-avatar.png" alt="iHoogi" style="width: 100px; height: 100px; border-radius: 50%; border: 5px solid white; box-shadow: 0 8px 20px rgba(0,0,0,0.2); background: white;">
                    <div style="position: absolute; bottom: -5px; right: -5px; background: #ef4444; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white;">
                      <span style="font-size: 16px;">🔐</span>
                    </div>
                  </div>
                  <h1 style="color: white; font-size: 32px; margin: 20px 0 0 0; font-weight: 700; text-shadow: 0 2px 10px rgba(0,0,0,0.1);">איפוס סיסמה</h1>
                    <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 10px 0 0 0;">בקשת איפוס סיסמה לחשבון שלכם 🔒</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px; direction: rtl; text-align: right;">
                  <p style="font-size: 20px; margin-bottom: 15px; color: #1f2937; font-weight: 600;">היי {{userName}},</p>
                  <p style="font-size: 16px; margin-bottom: 25px; color: #4b5563; line-height: 1.6;">קיבלנו את הבקשה שלכם לאיפוס סיסמה. אל דאגה, iHoogi כאן לעזור! 🤝</p>
                  
                  <!-- Warning Box -->
                  <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-right: 5px solid #f59e0b; padding: 25px; border-radius: 15px; margin: 30px 0; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.2);">
                    <div style="display: flex; align-items: center; margin-bottom: 15px;">
                      <span style="font-size: 32px; margin-left: 15px;">⚠️</span>
                      <h3 style="color: #92400e; margin: 0; font-size: 20px; font-weight: 700;">חשוב לדעת!</h3>
                    </div>
                    <div style="background: white; padding: 15px; border-radius: 10px;">
                      <p style="margin: 8px 0; color: #92400e; font-size: 15px; line-height: 1.6;">
                        <strong>🕐 הקישור תקף ל-{{expiryHours}} שעות בלבד</strong><br>
                        אם לא ביקשתם איפוס סיסמה, אתם יכולים להתעלם מהמייל הזה והסיסמה שלכם תישאר ללא שינוי.
                      </p>
                    </div>
                  </div>
                  
                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 40px 0;">
                    <a href="{{resetLink}}" style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 30px; font-weight: 700; font-size: 18px; display: inline-block; box-shadow: 0 10px 30px rgba(220, 38, 38, 0.4);">
                      🔐 אפסו את הסיסמה שלכם
                    </a>
                  </div>
                  
                  <!-- Link Box -->
                  <div style="background: #f9fafb; border: 2px dashed #d1d5db; padding: 20px; border-radius: 15px; margin: 30px 0;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; font-weight: 600;">אם הכפתור לא עובד, העתק את הקישור הזה:</p>
                    <p style="margin: 0; color: #2D66F2; font-size: 12px; word-break: break-all; direction: ltr; text-align: left;">{{resetLink}}</p>
                  </div>
                  
                  <!-- Security Tip -->
                  <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-right: 5px solid #2D66F2; padding: 20px; border-radius: 15px; margin: 30px 0;">
                    <p style="margin: 0; color: #1e40af; font-size: 15px; line-height: 1.6;">
                      <strong style="font-size: 16px;">🛡️ טיפ אבטחה מ-iHoogi:</strong><br>
                      בחר סיסמה חזקה עם אותיות, מספרים וסימנים. אל תשתמש באותה סיסמה באתרים שונים!
                    </p>
                  </div>
                  
                  <p style="font-size: 15px; color: #6b7280; margin-top: 30px; text-align: center; line-height: 1.6;">
                    יש בעיה? אני כאן לעזור! 💪<br>
                    פנה אלינו בכל שאלה.
                  </p>
                </div>
                
                <!-- Footer -->
                <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-top: 2px solid #e5e7eb; padding: 30px; text-align: center;">
                  <p style="color: #9ca3af; font-size: 13px; margin: 10px 0 0 0;">© 2024 iHoogi - הפלטפורמה החכמה ליצירת שאלונים. כל הזכויות שמורות.</p>
                  <p style="color: #d1d5db; font-size: 12px; margin: 5px 0 0 0;">נוצר עם ❤️ על ידי צוות iHoogi</p>
                </div>
                
              </div>
            </div>
          </body>
          </html>
        `,
        textContent: `
          איפוס סיסמה - iHoogi
          
          שלום {{userName}},
          
          קיבלנו בקשה לאיפוס הסיסמה של החשבון שלך.
          
          אם לא ביקשת איפוס סיסמה, אנא התעלם מהמייל הזה.
          הקישור יפוג בעוד {{expiryHours}} שעות.
          
          אפס סיסמה: {{resetLink}}
          
          אם יש לך בעיות עם הקישור, העתק והדבק את הכתובת הבאה בדפדפן:
          {{resetLink}}
          
          © 2024 iHoogi. כל הזכויות שמורות.
        `,
        variables: ["userName", "resetLink", "expiryHours"],
        isActive: true
      },
      {
        id: "3",
        name: "תשובה לתמיכה",
        type: "support-response",
        subject: "תשובה לפנייה שלך - iHoogi Support 💙",
        htmlContent: `
          <!DOCTYPE html>
          <html dir="rtl" lang="he">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: white; border-radius: 20px; padding: 0; box-shadow: 0 20px 60px rgba(0,0,0,0.2); overflow: hidden;">
                
                <!-- Header with iHoogi Avatar -->
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center; position: relative;">
                  <div style="display: inline-block; position: relative;">
                    <img src="/hoogi-new-avatar.png" alt="iHoogi" style="width: 100px; height: 100px; border-radius: 50%; border: 5px solid white; box-shadow: 0 8px 20px rgba(0,0,0,0.2); background: white;">
                    <div style="position: absolute; bottom: -5px; right: -5px; background: #2D66F2; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white;">
                      <span style="font-size: 16px;">💬</span>
                    </div>
                  </div>
                  <h1 style="color: white; font-size: 32px; margin: 20px 0 0 0; font-weight: 700; text-shadow: 0 2px 10px rgba(0,0,0,0.1);">קיבלת תשובה!</h1>
                  <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 10px 0 0 0;">עניתי על הפנייה שלך 😊</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px; direction: rtl; text-align: right;">
                  <p style="font-size: 20px; margin-bottom: 15px; color: #1f2937; font-weight: 600;">היי {{userName}},</p>
                  <p style="font-size: 16px; margin-bottom: 25px; color: #4b5563; line-height: 1.6;">תודה רבה שפנית אליי! 🙏 עברתי על הפנייה שלך והנה התשובה המלאה.</p>
                  
                  <!-- Ticket Info -->
                  <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-right: 5px solid #10b981; padding: 25px; border-radius: 15px; margin: 30px 0; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.1);">
                    <div style="display: flex; align-items: center; margin-bottom: 15px;">
                      <span style="font-size: 32px; margin-left: 15px;">📋</span>
                      <h3 style="color: #065f46; margin: 0; font-size: 20px; font-weight: 700;">פרטי הפנייה</h3>
                    </div>
                    <div style="background: white; padding: 15px; border-radius: 10px;">
                      <p style="margin: 8px 0; color: #374151; font-size: 15px;"><strong style="color: #10b981;">🔢 מספר פנייה:</strong> {{ticketNumber}}</p>
                      <p style="margin: 8px 0; color: #374151; font-size: 15px;"><strong style="color: #10b981;">📝 נושא:</strong> {{ticketSubject}}</p>
                      <p style="margin: 8px 0; color: #374151; font-size: 15px;"><strong style="color: #10b981;">📅 תאריך:</strong> {{ticketDate}}</p>
                    </div>
                  </div>
                  
                  <!-- Response Box -->
                  <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-right: 5px solid #2D66F2; padding: 25px; border-radius: 15px; margin: 30px 0; box-shadow: 0 4px 15px rgba(45, 102, 242, 0.1);">
                    <div style="display: flex; align-items: center; margin-bottom: 15px;">
                      <span style="font-size: 32px; margin-left: 15px;">💬</span>
                      <h3 style="color: #1e40af; margin: 0; font-size: 20px; font-weight: 700;">התשובה שלי</h3>
                    </div>
                    <div style="background: white; padding: 20px; border-radius: 10px; color: #374151; font-size: 15px; line-height: 1.8; white-space: pre-wrap;">{{supportResponse}}</div>
                  </div>
                  
                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 40px 0;">
                    <a href="{{ticketLink}}" style="background: linear-gradient(135deg, #2D66F2 0%, #1e40af 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 30px; font-weight: 700; font-size: 18px; display: inline-block; box-shadow: 0 10px 30px rgba(45, 102, 242, 0.4);">
                      👀 צפה בפנייה המלאה
                    </a>
                  </div>
                  
                  <!-- Help Box -->
                  <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-right: 5px solid #f59e0b; padding: 20px; border-radius: 15px; margin: 30px 0;">
                    <p style="margin: 0; color: #92400e; font-size: 15px; line-height: 1.6;">
                      <strong style="font-size: 16px;">🤔 עדיין צריך עזרה?</strong><br>
                      אם התשובה לא פתרה את הבעיה שלך, פתח פנייה חדשה ואחזור אליך בהקדם!
                    </p>
                  </div>
                  
                  <p style="font-size: 15px; color: #6b7280; margin-top: 30px; text-align: center; line-height: 1.6;">
                    אני תמיד כאן בשבילך! 💙<br>
                    iHoogi כאן בשבילך
                  </p>
                </div>
                
                <!-- Footer -->
                <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-top: 2px solid #e5e7eb; padding: 30px; text-align: center;">
                  <p style="color: #9ca3af; font-size: 13px; margin: 10px 0 0 0;">© 2024 iHoogi - הפלטפורמה החכמה ליצירת שאלונים. כל הזכויות שמורות.</p>
                  <p style="color: #d1d5db; font-size: 12px; margin: 5px 0 0 0;">נוצר עם ❤️ על ידי צוות iHoogi</p>
                </div>
                
              </div>
            </div>
          </body>
          </html>
        `,
        textContent: `
          תשובה לפנייה שלך - iHoogi Support
          
          שלום {{userName}},
          
          תודה שפנית אלינו! קיבלנו את הפנייה שלך וענינו עליה.
          
          פרטי הפנייה:
          - מספר פנייה: {{ticketNumber}}
          - נושא: {{ticketSubject}}
          - תאריך: {{ticketDate}}
          
          התשובה שלנו:
          {{supportResponse}}
          
          צפה בפנייה המלאה: {{ticketLink}}
          
          אם התשובה לא פתרה את הבעיה שלך, תוכל לפתוח פנייה חדשה.
          
          © 2024 iHoogi. כל הזכויות שמורות.
          צוות התמיכה שלנו כאן לעזור לך! 💙
        `,
        variables: ["userName", "ticketNumber", "ticketSubject", "ticketDate", "supportResponse", "ticketLink"],
        isActive: true
      },
      {
        id: "4",
        name: "הזמנת שותף",
        type: "partner-invitation",
        subject: "הזמנה מיוחדת: הצטרף לשותפים של iHoogi! 🤝",
        htmlContent: `
          <!DOCTYPE html>
          <html dir="rtl" lang="he">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: white; border-radius: 20px; padding: 0; box-shadow: 0 20px 60px rgba(0,0,0,0.2); overflow: hidden;">
                
                <!-- Header with iHoogi Avatar -->
                <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center; position: relative;">
                  <div style="display: inline-block; position: relative;">
                    <img src="/hoogi-new-avatar.png" alt="iHoogi" style="width: 100px; height: 100px; border-radius: 50%; border: 5px solid white; box-shadow: 0 8px 20px rgba(0,0,0,0.2); background: white;">
                    <div style="position: absolute; bottom: -5px; right: -5px; background: #10b981; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white;">
                      <span style="font-size: 16px;">🤝</span>
                    </div>
                  </div>
                  <h1 style="color: white; font-size: 32px; margin: 20px 0 0 0; font-weight: 700; text-shadow: 0 2px 10px rgba(0,0,0,0.1);">הזמנה מיוחדת!</h1>
                  <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 10px 0 0 0;">הצטרף לתוכנית השותפים של iHoogi 💰</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px; direction: rtl; text-align: right;">
                  <p style="font-size: 20px; margin-bottom: 15px; color: #1f2937; font-weight: 600;">היי {{partnerName}},</p>
                  <p style="font-size: 16px; margin-bottom: 25px; color: #4b5563; line-height: 1.6;">
                    <strong>{{inviterName}}</strong> הזמין אותך להצטרף לתוכנית השותפים שלנו! 🎉<br>
                    זו הזדמנות מעולה להרוויח יחד איתנו ולהיות חלק מהמהפכה בעולם השאלונים.
                  </p>
                  
                  <!-- Benefits Box -->
                  <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-right: 5px solid #f59e0b; padding: 25px; border-radius: 15px; margin: 30px 0; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.2);">
                    <div style="display: flex; align-items: center; margin-bottom: 20px;">
                      <span style="font-size: 32px; margin-left: 15px;">💰</span>
                      <h3 style="color: #92400e; margin: 0; font-size: 20px; font-weight: 700;">למה כדאי להצטרף?</h3>
                    </div>
                    <div style="background: white; padding: 20px; border-radius: 10px;">
                      <div style="margin-bottom: 12px; padding: 10px; background: #f9fafb; border-radius: 8px;">
                        <p style="margin: 0; color: #374151; font-size: 15px;">
                          <strong style="color: #f59e0b;">💸 עמלה של {{commissionRate}}%</strong> על כל מכירה שתביא
                        </p>
                      </div>
                      <div style="margin-bottom: 12px; padding: 10px; background: #f9fafb; border-radius: 8px;">
                        <p style="margin: 0; color: #374151; font-size: 15px;">
                          <strong style="color: #f59e0b;">🎨 חומרי שיווק מקצועיים</strong> להצלחה מובטחת
                        </p>
                      </div>
                      <div style="margin-bottom: 12px; padding: 10px; background: #f9fafb; border-radius: 8px;">
                        <p style="margin: 0; color: #374151; font-size: 15px;">
                          <strong style="color: #f59e0b;">🛠️ תמיכה טכנית מלאה</strong> 24/7
                        </p>
                      </div>
                      <div style="padding: 10px; background: #f9fafb; border-radius: 8px;">
                        <p style="margin: 0; color: #374151; font-size: 15px;">
                          <strong style="color: #f59e0b;">📊 דשבורד מתקדם</strong> למעקב אחר כל הרווחים
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 40px 0;">
                    <a href="{{invitationLink}}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 30px; font-weight: 700; font-size: 18px; display: inline-block; box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);">
                      🤝 אני רוצה להצטרף!
                    </a>
                  </div>
                  
                  <!-- Urgency Box -->
                  <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border-right: 5px solid #ef4444; padding: 20px; border-radius: 15px; margin: 30px 0;">
                    <p style="margin: 0; color: #991b1b; font-size: 15px; line-height: 1.6; text-align: center;">
                      <strong style="font-size: 16px;">⏰ מהר! ההזמנה תפוג בעוד {{expiryDays}} ימים</strong><br>
                      אל תפספס את ההזדמנות הזו!
                    </p>
                  </div>
                  
                  <!-- Info Box -->
                  <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-right: 5px solid #2D66F2; padding: 20px; border-radius: 15px; margin: 30px 0;">
                    <p style="margin: 0; color: #1e40af; font-size: 15px; line-height: 1.6;">
                      <strong style="font-size: 16px;">💡 איך זה עובד?</strong><br>
                      פשוט לחץ על הכפתור, השלם את ההרשמה, וקבל את הקישורים והכלים שלך. תוך דקות תתחיל להרוויח!
                    </p>
                  </div>
                  
                  <p style="font-size: 15px; color: #6b7280; margin-top: 30px; text-align: center; line-height: 1.6;">
                    אשמח לראות אותך בקבוצת השותפים! 🎊<br>
                    iHoogi כאן בשבילך
                  </p>
                </div>
                
                <!-- Footer -->
                <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-top: 2px solid #e5e7eb; padding: 30px; text-align: center;">
                  <p style="color: #9ca3af; font-size: 13px; margin: 10px 0 0 0;">© 2024 iHoogi - הפלטפורמה החכמה ליצירת שאלונים. כל הזכויות שמורות.</p>
                  <p style="color: #d1d5db; font-size: 12px; margin: 5px 0 0 0;">נוצר עם ❤️ על ידי צוות iHoogi</p>
                </div>
                
              </div>
            </div>
          </body>
          </html>
        `,
        textContent: `
          הזמנה להצטרף כשותף - iHoogi
          
          שלום {{partnerName}},
          
          {{inviterName}} הזמין אותך להצטרף כשותף בתוכנית השותפים של iHoogi!
          
          יתרונות השותפות:
          - עמלה של {{commissionRate}}% על כל מכירה
          - חומרי שיווק מקצועיים
          - תמיכה טכנית מלאה
          - דשבורד מתקדם למעקב מכירות
          
          הצטרף כשותף: {{invitationLink}}
          
          ההזמנה תפוג בעוד {{expiryDays}} ימים.
          
          © 2024 iHoogi. כל הזכויות שמורות.
        `,
        variables: ["partnerName", "inviterName", "commissionRate", "invitationLink", "expiryDays"],
        isActive: true
      },
      {
        id: "5",
        name: "הזמנה לשאלון",
        type: "questionnaire-invitation",
        subject: "הזמנה לשאלון - {{questionnaireTitle}} 📋",
        htmlContent: `
          <!DOCTYPE html>
          <html dir="rtl" lang="he">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: white; border-radius: 20px; padding: 0; box-shadow: 0 20px 60px rgba(0,0,0,0.2); overflow: hidden;">
                
                <!-- Header with iHoogi Avatar -->
                <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px 30px; text-align: center; position: relative;">
                  <div style="display: inline-block; position: relative;">
                    <img src="/hoogi-new-avatar.png" alt="iHoogi" style="width: 100px; height: 100px; border-radius: 50%; border: 5px solid white; box-shadow: 0 8px 20px rgba(0,0,0,0.2); background: white;">
                    <div style="position: absolute; bottom: -5px; right: -5px; background: #f59e0b; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white;">
                      <span style="font-size: 16px;">📋</span>
                    </div>
                  </div>
                  <h1 style="color: white; font-size: 32px; margin: 20px 0 0 0; font-weight: 700; text-shadow: 0 2px 10px rgba(0,0,0,0.1);">הזמנה לשאלון</h1>
                  <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 10px 0 0 0;">{{questionnaireTitle}} 🎯</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px; direction: rtl; text-align: right;">
                  <p style="font-size: 20px; margin-bottom: 15px; color: #1f2937; font-weight: 600;">היי {{recipientName}},</p>
                  <p style="font-size: 16px; margin-bottom: 25px; color: #4b5563; line-height: 1.6;">{{senderName}} הזמין אותך להשתתף בשאלון חשוב! 🎉</p>
                  
                  <!-- Questionnaire Info -->
                  <div style="background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%); border-right: 5px solid #8b5cf6; padding: 25px; border-radius: 15px; margin: 30px 0; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.1);">
                    <div style="display: flex; align-items: center; margin-bottom: 15px;">
                      <span style="font-size: 32px; margin-left: 15px;">📊</span>
                      <h3 style="color: #6b21a8; margin: 0; font-size: 20px; font-weight: 700;">פרטי השאלון</h3>
                    </div>
                    <div style="background: white; padding: 15px; border-radius: 10px;">
                      <p style="margin: 8px 0; color: #374151; font-size: 15px;"><strong style="color: #8b5cf6;">📝 כותרת:</strong> {{questionnaireTitle}}</p>
                      <p style="margin: 8px 0; color: #374151; font-size: 15px;"><strong style="color: #8b5cf6;">📅 תאריך:</strong> {{questionnaireDate}}</p>
                      <p style="margin: 8px 0; color: #374151; font-size: 15px;"><strong style="color: #8b5cf6;">⏱️ זמן משוער:</strong> {{estimatedTime}}</p>
                      <p style="margin: 8px 0; color: #374151; font-size: 15px;"><strong style="color: #8b5cf6;">🎁 תגמול:</strong> {{reward}}</p>
                    </div>
                  </div>
                  
                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 40px 0;">
                    <a href="{{questionnaireLink}}" style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 30px; font-weight: 700; font-size: 18px; display: inline-block; box-shadow: 0 10px 30px rgba(139, 92, 246, 0.4);">
                      📋 התחל לענות על השאלון
                    </a>
                  </div>
                  
                  <!-- Description -->
                  <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-right: 5px solid #2D66F2; padding: 20px; border-radius: 15px; margin: 30px 0;">
                    <p style="margin: 0; color: #1e40af; font-size: 15px; line-height: 1.6;">
                      <strong style="font-size: 16px;">📝 תיאור השאלון:</strong><br>
                      {{questionnaireDescription}}
                    </p>
                  </div>
                  
                  <p style="font-size: 15px; color: #6b7280; margin-top: 30px; text-align: center; line-height: 1.6;">
                    תודה על ההשתתפות! 🙏<br>
                    התגובות שלך חשובות לנו מאוד.
                  </p>
                </div>
                
                <!-- Footer -->
                <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-top: 2px solid #e5e7eb; padding: 30px; text-align: center;">
                  <p style="color: #9ca3af; font-size: 13px; margin: 10px 0 0 0;">© 2024 iHoogi - הפלטפורמה החכמה ליצירת שאלונים. כל הזכויות שמורות.</p>
                  <p style="color: #d1d5db; font-size: 12px; margin: 5px 0 0 0;">נוצר עם ❤️ על ידי צוות iHoogi</p>
                </div>
                
              </div>
            </div>
          </body>
          </html>
        `,
        textContent: `
          הזמנה לשאלון - {{questionnaireTitle}}
          
          שלום {{recipientName}},
          
          {{senderName}} הזמין אותך להשתתף בשאלון חשוב!
          
          פרטי השאלון:
          - כותרת: {{questionnaireTitle}}
          - תאריך: {{questionnaireDate}}
          - זמן משוער: {{estimatedTime}}
          - תגמול: {{reward}}
          
          תיאור השאלון:
          {{questionnaireDescription}}
          
          התחל לענות: {{questionnaireLink}}
          
          תודה על ההשתתפות!
          
          © 2024 iHoogi. כל הזכויות שמורות.
        `,
        variables: ["recipientName", "senderName", "questionnaireTitle", "questionnaireDate", "estimatedTime", "reward", "questionnaireDescription", "questionnaireLink"],
        isActive: true
      },
      {
        id: "6",
        name: "תזכורת לשאלון",
        type: "questionnaire-reminder",
        subject: "תזכורת: השאלון שלך מחכה לך! ⏰",
        htmlContent: `
          <!DOCTYPE html>
          <html dir="rtl" lang="he">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: white; border-radius: 20px; padding: 0; box-shadow: 0 20px 60px rgba(0,0,0,0.2); overflow: hidden;">
                
                <!-- Header with iHoogi Avatar -->
                <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center; position: relative;">
                  <div style="display: inline-block; position: relative;">
                    <img src="/hoogi-new-avatar.png" alt="iHoogi" style="width: 100px; height: 100px; border-radius: 50%; border: 5px solid white; box-shadow: 0 8px 20px rgba(0,0,0,0.2); background: white;">
                    <div style="position: absolute; bottom: -5px; right: -5px; background: #ef4444; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white;">
                      <span style="font-size: 16px;">⏰</span>
                    </div>
                  </div>
                  <h1 style="color: white; font-size: 32px; margin: 20px 0 0 0; font-weight: 700; text-shadow: 0 2px 10px rgba(0,0,0,0.1);">תזכורת לשאלון</h1>
                  <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 10px 0 0 0;">השאלון שלך מחכה לך! 🎯</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px; direction: rtl; text-align: right;">
                  <p style="font-size: 20px; margin-bottom: 15px; color: #1f2937; font-weight: 600;">היי {{recipientName}},</p>
                  <p style="font-size: 16px; margin-bottom: 25px; color: #4b5563; line-height: 1.6;">לא שכחתי אותך! 😊 השאלון עדיין מחכה לתגובה שלך.</p>
                  
                  <!-- Urgency Box -->
                  <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-right: 5px solid #f59e0b; padding: 25px; border-radius: 15px; margin: 30px 0; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.2);">
                    <div style="display: flex; align-items: center; margin-bottom: 15px;">
                      <span style="font-size: 32px; margin-left: 15px;">⚠️</span>
                      <h3 style="color: #92400e; margin: 0; font-size: 20px; font-weight: 700;">זמן מוגבל!</h3>
                    </div>
                    <div style="background: white; padding: 15px; border-radius: 10px;">
                      <p style="margin: 8px 0; color: #92400e; font-size: 15px; line-height: 1.6;">
                        <strong>⏰ השאלון ייסגר בעוד {{timeLeft}}</strong><br>
                        אל תפספס את ההזדמנות לתת את הדעה שלך!
                      </p>
                    </div>
                  </div>
                  
                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 40px 0;">
                    <a href="{{questionnaireLink}}" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 30px; font-weight: 700; font-size: 18px; display: inline-block; box-shadow: 0 10px 30px rgba(245, 158, 11, 0.4);">
                      ⏰ השלם את השאלון עכשיו
                    </a>
                  </div>
                  
                  <!-- Benefits -->
                  <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-right: 5px solid #10b981; padding: 20px; border-radius: 15px; margin: 30px 0;">
                    <p style="margin: 0; color: #065f46; font-size: 15px; line-height: 1.6;">
                      <strong style="font-size: 16px;">🎁 למה כדאי להשתתף?</strong><br>
                      • התגובה שלך תשפיע על השירות שלנו<br>
                      • תקבל {{reward}} כהערכה על ההשתתפות<br>
                      • זמן השאלון: רק {{estimatedTime}} דקות
                    </p>
                  </div>
                  
                  <p style="font-size: 15px; color: #6b7280; margin-top: 30px; text-align: center; line-height: 1.6;">
                    אם כבר השלמת את השאלון, תודה רבה! 🙏<br>
                    אם לא, זה הזמן המושלם להשלים אותו.
                  </p>
                </div>
                
                <!-- Footer -->
                <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-top: 2px solid #e5e7eb; padding: 30px; text-align: center;">
                  <p style="color: #9ca3af; font-size: 13px; margin: 10px 0 0 0;">© 2024 iHoogi - הפלטפורמה החכמה ליצירת שאלונים. כל הזכויות שמורות.</p>
                  <p style="color: #d1d5db; font-size: 12px; margin: 5px 0 0 0;">נוצר עם ❤️ על ידי צוות iHoogi</p>
                </div>
                
              </div>
            </div>
          </body>
          </html>
        `,
        textContent: `
          תזכורת לשאלון
          
          שלום {{recipientName}},
          
          השאלון שלך עדיין מחכה לתגובה!
          
          זמן מוגבל:
          השאלון ייסגר בעוד {{timeLeft}}
          
          למה כדאי להשתתף:
          • התגובה שלך תשפיע על השירות שלנו
          • תקבל {{reward}} כהערכה על ההשתתפות
          • זמן השאלון: רק {{estimatedTime}} דקות
          
          השלם את השאלון: {{questionnaireLink}}
          
          אם כבר השלמת את השאלון, תודה רבה!
          
          © 2024 iHoogi. כל הזכויות שמורות.
        `,
        variables: ["recipientName", "questionnaireLink", "timeLeft", "reward", "estimatedTime"],
        isActive: true
      },
      {
        id: "7",
        name: "תודה על השתתפות",
        type: "thank-you-response",
        subject: "תודה רבה על ההשתתפות! 🎉",
        htmlContent: `
          <!DOCTYPE html>
          <html dir="rtl" lang="he">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: white; border-radius: 20px; padding: 0; box-shadow: 0 20px 60px rgba(0,0,0,0.2); overflow: hidden;">
                
                <!-- Header with iHoogi Avatar -->
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center; position: relative;">
                  <div style="display: inline-block; position: relative;">
                    <img src="/hoogi-new-avatar.png" alt="iHoogi" style="width: 100px; height: 100px; border-radius: 50%; border: 5px solid white; box-shadow: 0 8px 20px rgba(0,0,0,0.2); background: white;">
                    <div style="position: absolute; bottom: -5px; right: -5px; background: #f59e0b; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white;">
                      <span style="font-size: 16px;">🎉</span>
                    </div>
                  </div>
                  <h1 style="color: white; font-size: 32px; margin: 20px 0 0 0; font-weight: 700; text-shadow: 0 2px 10px rgba(0,0,0,0.1);">תודה רבה!</h1>
                  <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 10px 0 0 0;">השלמת את השאלון בהצלחה! 🎯</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px; direction: rtl; text-align: right;">
                  <p style="font-size: 20px; margin-bottom: 15px; color: #1f2937; font-weight: 600;">היי {{recipientName}},</p>
                  <p style="font-size: 16px; margin-bottom: 25px; color: #4b5563; line-height: 1.6;">וואו! 🎉 השלמת את השאלון בהצלחה! תודה רבה על הזמן והמאמץ שהשקעת.</p>
                  
                  <!-- Success Box -->
                  <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-right: 5px solid #10b981; padding: 25px; border-radius: 15px; margin: 30px 0; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.1);">
                    <div style="display: flex; align-items: center; margin-bottom: 15px;">
                      <span style="font-size: 32px; margin-left: 15px;">✅</span>
                      <h3 style="color: #065f46; margin: 0; font-size: 20px; font-weight: 700;">השאלון הושלם!</h3>
                    </div>
                    <div style="background: white; padding: 15px; border-radius: 10px;">
                      <p style="margin: 8px 0; color: #374151; font-size: 15px;"><strong style="color: #10b981;">📝 שאלון:</strong> {{questionnaireTitle}}</p>
                      <p style="margin: 8px 0; color: #374151; font-size: 15px;"><strong style="color: #10b981;">📅 תאריך השלמה:</strong> {{completionDate}}</p>
                      <p style="margin: 8px 0; color: #374151; font-size: 15px;"><strong style="color: #10b981;">⏱️ זמן השקעת:</strong> {{timeSpent}}</p>
                    </div>
                  </div>
                  
                  <!-- Reward Box -->
                  <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-right: 5px solid #f59e0b; padding: 25px; border-radius: 15px; margin: 30px 0; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.2);">
                    <div style="display: flex; align-items: center; margin-bottom: 15px;">
                      <span style="font-size: 32px; margin-left: 15px;">🎁</span>
                      <h3 style="color: #92400e; margin: 0; font-size: 20px; font-weight: 700;">התגמול שלך!</h3>
                    </div>
                    <div style="background: white; padding: 15px; border-radius: 10px;">
                      <p style="margin: 8px 0; color: #92400e; font-size: 15px; line-height: 1.6;">
                        <strong>🎉 {{reward}}</strong><br>
                        תודה על ההשתתפות! התגובה שלך עוזרת לנו לשפר את השירות.
                      </p>
                    </div>
                  </div>
                  
                  <!-- Next Steps -->
                  <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-right: 5px solid #2D66F2; padding: 20px; border-radius: 15px; margin: 30px 0;">
                    <p style="margin: 0; color: #1e40af; font-size: 15px; line-height: 1.6;">
                      <strong style="font-size: 16px;">📊 מה הלאה?</strong><br>
                      {{nextSteps}}
                    </p>
                  </div>
                  
                  <p style="font-size: 15px; color: #6b7280; margin-top: 30px; text-align: center; line-height: 1.6;">
                    שוב תודה רבה! 🙏<br>
                    התגובה שלך חשובה לנו מאוד.
                  </p>
                </div>
                
                <!-- Footer -->
                <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-top: 2px solid #e5e7eb; padding: 30px; text-align: center;">
                  <p style="color: #9ca3af; font-size: 13px; margin: 10px 0 0 0;">© 2024 iHoogi - הפלטפורמה החכמה ליצירת שאלונים. כל הזכויות שמורות.</p>
                  <p style="color: #d1d5db; font-size: 12px; margin: 5px 0 0 0;">נוצר עם ❤️ על ידי צוות iHoogi</p>
                </div>
                
              </div>
            </div>
          </body>
          </html>
        `,
        textContent: `
          תודה רבה על ההשתתפות!
          
          שלום {{recipientName}},
          
          השלמת את השאלון בהצלחה! תודה רבה על הזמן והמאמץ שהשקעת.
          
          פרטי השאלון:
          - שאלון: {{questionnaireTitle}}
          - תאריך השלמה: {{completionDate}}
          - זמן השקעת: {{timeSpent}}
          
          התגמול שלך:
          {{reward}}
          
          מה הלאה?
          {{nextSteps}}
          
          שוב תודה רבה! התגובה שלך חשובה לנו מאוד.
          
          © 2024 iHoogi. כל הזכויות שמורות.
        `,
        variables: ["recipientName", "questionnaireTitle", "completionDate", "timeSpent", "reward", "nextSteps"],
        isActive: true
      },
      {
        id: "8",
        name: "הודעת שגיאה",
        type: "error-notification",
        subject: "הודעת שגיאה - {{errorType}} ⚠️",
        htmlContent: `
          <!DOCTYPE html>
          <html dir="rtl" lang="he">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: white; border-radius: 20px; padding: 0; box-shadow: 0 20px 60px rgba(0,0,0,0.2); overflow: hidden;">
                
                <!-- Header with iHoogi Avatar -->
                <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 30px; text-align: center; position: relative;">
                  <div style="display: inline-block; position: relative;">
                    <img src="/hoogi-new-avatar.png" alt="iHoogi" style="width: 100px; height: 100px; border-radius: 50%; border: 5px solid white; box-shadow: 0 8px 20px rgba(0,0,0,0.2); background: white;">
                    <div style="position: absolute; bottom: -5px; right: -5px; background: #f59e0b; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white;">
                      <span style="font-size: 16px;">⚠️</span>
                    </div>
                  </div>
                  <h1 style="color: white; font-size: 32px; margin: 20px 0 0 0; font-weight: 700; text-shadow: 0 2px 10px rgba(0,0,0,0.1);">הודעת שגיאה</h1>
                  <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 10px 0 0 0;">{{errorType}} 🚨</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px; direction: rtl; text-align: right;">
                  <p style="font-size: 20px; margin-bottom: 15px; color: #1f2937; font-weight: 600;">היי {{userName}},</p>
                  <p style="font-size: 16px; margin-bottom: 25px; color: #4b5563; line-height: 1.6;">אופס! 😅 קרתה שגיאה במערכת. אני כבר עובד על התיקון!</p>
                  
                  <!-- Error Details -->
                  <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-right: 5px solid #ef4444; padding: 25px; border-radius: 15px; margin: 30px 0; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.1);">
                    <div style="display: flex; align-items: center; margin-bottom: 15px;">
                      <span style="font-size: 32px; margin-left: 15px;">🔍</span>
                      <h3 style="color: #991b1b; margin: 0; font-size: 20px; font-weight: 700;">פרטי השגיאה</h3>
                    </div>
                    <div style="background: white; padding: 15px; border-radius: 10px;">
                      <p style="margin: 8px 0; color: #374151; font-size: 15px;"><strong style="color: #ef4444;">⚠️ סוג שגיאה:</strong> {{errorType}}</p>
                      <p style="margin: 8px 0; color: #374151; font-size: 15px;"><strong style="color: #ef4444;">📅 תאריך:</strong> {{errorDate}}</p>
                      <p style="margin: 8px 0; color: #374151; font-size: 15px;"><strong style="color: #ef4444;">🕐 שעה:</strong> {{errorTime}}</p>
                      <p style="margin: 8px 0; color: #374151; font-size: 15px;"><strong style="color: #ef4444;">📝 תיאור:</strong> {{errorDescription}}</p>
                    </div>
                  </div>
                  
                  <!-- Status Box -->
                  <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-right: 5px solid #f59e0b; padding: 25px; border-radius: 15px; margin: 30px 0; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.2);">
                    <div style="display: flex; align-items: center; margin-bottom: 15px;">
                      <span style="font-size: 32px; margin-left: 15px;">🔧</span>
                      <h3 style="color: #92400e; margin: 0; font-size: 20px; font-weight: 700;">סטטוס התיקון</h3>
                    </div>
                    <div style="background: white; padding: 15px; border-radius: 10px;">
                      <p style="margin: 8px 0; color: #92400e; font-size: 15px; line-height: 1.6;">
                        <strong>🔄 {{fixStatus}}</strong><br>
                        {{fixDescription}}
                      </p>
                    </div>
                  </div>
                  
                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 40px 0;">
                    <a href="{{supportLink}}" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 30px; font-weight: 700; font-size: 18px; display: inline-block; box-shadow: 0 10px 30px rgba(239, 68, 68, 0.4);">
                      📞 פנה לתמיכה
                    </a>
                  </div>
                  
                  <!-- Apology -->
                  <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-right: 5px solid #2D66F2; padding: 20px; border-radius: 15px; margin: 30px 0;">
                    <p style="margin: 0; color: #1e40af; font-size: 15px; line-height: 1.6;">
                      <strong style="font-size: 16px;">🙏 סליחה על אי הנוחות!</strong><br>
                      אנחנו עובדים קשה כדי לתקן את הבעיה במהירות האפשרית. אם יש לך שאלות נוספות, אני כאן לעזור!
                    </p>
                  </div>
                  
                  <p style="font-size: 15px; color: #6b7280; margin-top: 30px; text-align: center; line-height: 1.6;">
                    תודה על הסבלנות! 💪<br>
                    נחזור אליך ברגע שהבעיה תיפתר.
                  </p>
                </div>
                
                <!-- Footer -->
                <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-top: 2px solid #e5e7eb; padding: 30px; text-align: center;">
                  <p style="color: #9ca3af; font-size: 13px; margin: 10px 0 0 0;">© 2024 iHoogi - הפלטפורמה החכמה ליצירת שאלונים. כל הזכויות שמורות.</p>
                  <p style="color: #d1d5db; font-size: 12px; margin: 5px 0 0 0;">נוצר עם ❤️ על ידי צוות iHoogi</p>
                </div>
                
              </div>
            </div>
          </body>
          </html>
        `,
        textContent: `
          הודעת שגיאה - {{errorType}}
          
          שלום {{userName}},
          
          קרתה שגיאה במערכת. אנחנו עובדים על התיקון!
          
          פרטי השגיאה:
          - סוג שגיאה: {{errorType}}
          - תאריך: {{errorDate}}
          - שעה: {{errorTime}}
          - תיאור: {{errorDescription}}
          
          סטטוס התיקון:
          {{fixStatus}}
          {{fixDescription}}
          
          אם יש לך שאלות נוספות, פנה לתמיכה: {{supportLink}}
          
          סליחה על אי הנוחות! אנחנו עובדים קשה כדי לתקן את הבעיה.
          
          © 2024 iHoogi. כל הזכויות שמורות.
        `,
        variables: ["userName", "errorType", "errorDate", "errorTime", "errorDescription", "fixStatus", "fixDescription", "supportLink"],
        isActive: true
      },
      {
        id: "9",
        name: "שינוי מנוי",
        type: "subscription-change",
        subject: "שינוי במנוי שלכם - iHoogi 📋",
        htmlContent: `
          <!DOCTYPE html>
          <html dir="rtl" lang="he">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: white; border-radius: 20px; padding: 0; box-shadow: 0 20px 60px rgba(0,0,0,0.2); overflow: hidden;">
                
                <!-- Header with iHoogi Avatar -->
                <div style="background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); padding: 40px 30px; text-align: center; position: relative;">
                  <div style="display: inline-block; position: relative;">
                    <img src="/hoogi-new-avatar.png" alt="iHoogi" style="width: 100px; height: 100px; border-radius: 50%; border: 5px solid white; box-shadow: 0 8px 20px rgba(0,0,0,0.2); background: white;">
                    <div style="position: absolute; bottom: -5px; right: -5px; background: #10b981; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white;">
                      <span style="font-size: 16px;">📋</span>
                    </div>
                  </div>
                  <h1 style="color: white; font-size: 32px; margin: 20px 0 0 0; font-weight: 700; text-shadow: 0 2px 10px rgba(0,0,0,0.1);">שינוי במנוי</h1>
                  <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 10px 0 0 0;">עדכנו את המנוי שלכם 📊</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px; direction: rtl; text-align: right;">
                  <p style="font-size: 20px; margin-bottom: 15px; color: #1f2937; font-weight: 600;">שלום {{userName}},</p>
                  <p style="font-size: 16px; margin-bottom: 25px; color: #4b5563; line-height: 1.6;">קיבלנו את הבקשה שלכם לשינוי המנוי! המעבר יעשה בקרוב ואתם תקבלו עדכון נוסף. 🎉</p>
                  
                  <!-- Subscription Details -->
                  <div style="background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%); border-right: 5px solid #7c3aed; padding: 25px; border-radius: 15px; margin: 30px 0; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.1);">
                    <div style="display: flex; align-items: center; margin-bottom: 15px;">
                      <span style="font-size: 32px; margin-left: 15px;">📊</span>
                      <h3 style="color: #6b21a8; margin: 0; font-size: 20px; font-weight: 700;">פרטי השינוי</h3>
                    </div>
                    <div style="background: white; padding: 15px; border-radius: 10px;">
                      <p style="margin: 8px 0; color: #374151; font-size: 15px;"><strong style="color: #7c3aed;">🔄 מ:</strong> {{oldPlan}}</p>
                      <p style="margin: 8px 0; color: #374151; font-size: 15px;"><strong style="color: #7c3aed;">➡️ אל:</strong> {{newPlan}}</p>
                      <p style="margin: 8px 0; color: #374151; font-size: 15px;"><strong style="color: #7c3aed;">💰 מחיר חדש:</strong> {{newPrice}}</p>
                      <p style="margin: 8px 0; color: #374151; font-size: 15px;"><strong style="color: #7c3aed;">📅 תאריך שינוי:</strong> {{changeDate}}</p>
                    </div>
                  </div>
                  
                  <!-- Benefits -->
                  <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-right: 5px solid #10b981; padding: 25px; border-radius: 15px; margin: 30px 0;">
                    <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 20px; font-weight: 700;">🎁 מה תקבלו במנוי החדש:</h3>
                    <div style="background: white; padding: 15px; border-radius: 10px;">
                      {{planBenefits}}
                    </div>
                  </div>
                  
                  <!-- Important Info -->
                  <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-right: 5px solid #f59e0b; padding: 25px; border-radius: 15px; margin: 30px 0;">
                    <div style="display: flex; align-items: center; margin-bottom: 15px;">
                      <span style="font-size: 32px; margin-left: 15px;">ℹ️</span>
                      <h3 style="color: #92400e; margin: 0; font-size: 20px; font-weight: 700;">מידע חשוב</h3>
                    </div>
                    <div style="background: white; padding: 15px; border-radius: 10px;">
                      <p style="margin: 0; color: #92400e; font-size: 15px; line-height: 1.6;">
                        {{importantInfo}}
                      </p>
                    </div>
                  </div>
                  
                  <p style="font-size: 15px; color: #6b7280; margin-top: 30px; text-align: center; line-height: 1.6;">
                    תודה על האמון! 🙏<br>
                    iHoogi כאן בשבילכם
                  </p>
                </div>
                
                <!-- Footer -->
                <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-top: 2px solid #e5e7eb; padding: 30px; text-align: center;">
                  <p style="color: #9ca3af; font-size: 13px; margin: 10px 0 0 0;">© 2024 iHoogi - הפלטפורמה החכמה ליצירת שאלונים. כל הזכויות שמורות.</p>
                  <p style="color: #d1d5db; font-size: 12px; margin: 5px 0 0 0;">נוצר עם ❤️ על ידי צוות iHoogi</p>
                </div>
                
              </div>
            </div>
          </body>
          </html>
        `,
        textContent: `
          שינוי במנוי - iHoogi
          
          שלום {{userName}},
          
          קיבלנו את הבקשה שלכם לשינוי המנוי!
          
          פרטי השינוי:
          - מ: {{oldPlan}}
          - אל: {{newPlan}}
          - מחיר חדש: {{newPrice}}
          - תאריך שינוי: {{changeDate}}
          
          מה תקבלו במנוי החדש:
          {{planBenefits}}
          
          מידע חשוב:
          {{importantInfo}}
          
          תודה על האמון!
          
          © 2024 iHoogi. כל הזכויות שמורות.
        `,
        variables: ["userName", "oldPlan", "newPlan", "newPrice", "changeDate", "planBenefits", "importantInfo"],
        isActive: true
      },
      {
        id: "10",
        name: "קבלה",
        type: "receipt",
        subject: "קבלת התשלום שלכם - iHoogi 💰",
        htmlContent: `
          <!DOCTYPE html>
          <html dir="rtl" lang="he">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #059669 0%, #047857 100%);">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: white; border-radius: 20px; padding: 0; box-shadow: 0 20px 60px rgba(0,0,0,0.2); overflow: hidden;">
                
                <!-- Header with iHoogi Avatar -->
                <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 40px 30px; text-align: center; position: relative;">
                  <div style="display: inline-block; position: relative;">
                    <img src="/hoogi-new-avatar.png" alt="iHoogi" style="width: 100px; height: 100px; border-radius: 50%; border: 5px solid white; box-shadow: 0 8px 20px rgba(0,0,0,0.2); background: white;">
                    <div style="position: absolute; bottom: -5px; right: -5px; background: #10b981; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white;">
                      <span style="font-size: 16px;">💰</span>
                    </div>
                  </div>
                  <h1 style="color: white; font-size: 32px; margin: 20px 0 0 0; font-weight: 700; text-shadow: 0 2px 10px rgba(0,0,0,0.1);">קבלה</h1>
                  <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 10px 0 0 0;">התשלום התקבל בהצלחה! ✅</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px; direction: rtl; text-align: right;">
                  <p style="font-size: 20px; margin-bottom: 15px; color: #1f2937; font-weight: 600;">שלום {{userName}},</p>
                  <p style="font-size: 16px; margin-bottom: 25px; color: #4b5563; line-height: 1.6;">תודה רבה על התשלום! קיבלנו אותו בהצלחה והמנוי שלכם פעיל. 🎉</p>
                  
                  <!-- Receipt Details -->
                  <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-right: 5px solid #059669; padding: 25px; border-radius: 15px; margin: 30px 0; box-shadow: 0 4px 15px rgba(5, 150, 105, 0.1);">
                    <div style="display: flex; align-items: center; margin-bottom: 15px;">
                      <span style="font-size: 32px; margin-left: 15px;">📄</span>
                      <h3 style="color: #065f46; margin: 0; font-size: 20px; font-weight: 700;">פרטי הקבלה</h3>
                    </div>
                    <div style="background: white; padding: 15px; border-radius: 10px;">
                      <p style="margin: 8px 0; color: #374151; font-size: 15px;"><strong style="color: #059669;">🧾 מספר קבלה:</strong> {{receiptNumber}}</p>
                      <p style="margin: 8px 0; color: #374151; font-size: 15px;"><strong style="color: #059669;">📅 תאריך:</strong> {{paymentDate}}</p>
                      <p style="margin: 8px 0; color: #374151; font-size: 15px;"><strong style="color: #059669;">💳 אמצעי תשלום:</strong> {{paymentMethod}}</p>
                      <p style="margin: 8px 0; color: #374151; font-size: 15px;"><strong style="color: #059669;">💰 סכום:</strong> {{amount}}</p>
                      <p style="margin: 8px 0; color: #374151; font-size: 15px;"><strong style="color: #059669;">📦 פריט:</strong> {{itemDescription}}</p>
                    </div>
                  </div>
                  
                  <!-- Payment Summary -->
                  <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-right: 5px solid #2563eb; padding: 25px; border-radius: 15px; margin: 30px 0;">
                    <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 20px; font-weight: 700;">📊 סיכום התשלום</h3>
                    <div style="background: white; padding: 15px; border-radius: 10px;">
                      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>מחיר לפני מע"מ:</span>
                        <span><strong>{{subtotal}}</strong></span>
                      </div>
                      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>מע"מ:</span>
                        <span><strong>{{tax}}</strong></span>
                      </div>
                      <hr style="border: 1px solid #e5e7eb; margin: 10px 0;">
                      <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 18px; color: #059669;">
                        <span>סך הכל:</span>
                        <span>{{total}}</span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Next Steps -->
                  <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-right: 5px solid #f59e0b; padding: 20px; border-radius: 15px; margin: 30px 0;">
                    <p style="margin: 0; color: #92400e; font-size: 15px; line-height: 1.6;">
                      <strong style="font-size: 16px;">🎯 השלבים הבאים:</strong><br>
                      המנוי שלכם פעיל מיד! תוכלו להתחיל להשתמש בכל התכונות החדשות. אם יש לכם שאלות, iHoogi כאן בשבילכם!
                    </p>
                  </div>
                  
                  <p style="font-size: 15px; color: #6b7280; margin-top: 30px; text-align: center; line-height: 1.6;">
                    תודה על הבחירה בנו! 🙏<br>
                    iHoogi כאן בשבילכם
                  </p>
                </div>
                
                <!-- Footer -->
                <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-top: 2px solid #e5e7eb; padding: 30px; text-align: center;">
                  <p style="color: #9ca3af; font-size: 13px; margin: 10px 0 0 0;">© 2024 iHoogi - הפלטפורמה החכמה ליצירת שאלונים. כל הזכויות שמורות.</p>
                  <p style="color: #d1d5db; font-size: 12px; margin: 5px 0 0 0;">נוצר עם ❤️ על ידי צוות iHoogi</p>
                </div>
                
              </div>
            </div>
          </body>
          </html>
        `,
        textContent: `
          קבלה - iHoogi
          
          שלום {{userName}},
          
          תודה רבה על התשלום! קיבלנו אותו בהצלחה.
          
          פרטי הקבלה:
          - מספר קבלה: {{receiptNumber}}
          - תאריך: {{paymentDate}}
          - אמצעי תשלום: {{paymentMethod}}
          - סכום: {{amount}}
          - פריט: {{itemDescription}}
          
          סיכום התשלום:
          - מחיר לפני מע"מ: {{subtotal}}
          - מע"מ: {{tax}}
          - סך הכל: {{total}}
          
          השלבים הבאים:
          המנוי שלכם פעיל מיד! תוכלו להתחיל להשתמש בכל התכונות החדשות.
          
          תודה על הבחירה בנו!
          
          © 2024 iHoogi. כל הזכויות שמורות.
        `,
        variables: ["userName", "receiptNumber", "paymentDate", "paymentMethod", "amount", "itemDescription", "subtotal", "tax", "total"],
        isActive: true
      },
      {
        id: "11",
        name: "חשבונית",
        type: "invoice",
        subject: "חשבונית - iHoogi 📋",
        htmlContent: `
          <!DOCTYPE html>
          <html dir="rtl" lang="he">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: white; border-radius: 20px; padding: 0; box-shadow: 0 20px 60px rgba(0,0,0,0.2); overflow: hidden;">
                
                <!-- Header with iHoogi Avatar -->
                <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 40px 30px; text-align: center; position: relative;">
                  <div style="display: inline-block; position: relative;">
                    <img src="/hoogi-new-avatar.png" alt="iHoogi" style="width: 100px; height: 100px; border-radius: 50%; border: 5px solid white; box-shadow: 0 8px 20px rgba(0,0,0,0.2); background: white;">
                    <div style="position: absolute; bottom: -5px; right: -5px; background: #f59e0b; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white;">
                      <span style="font-size: 16px;">📋</span>
                    </div>
                  </div>
                  <h1 style="color: white; font-size: 32px; margin: 20px 0 0 0; font-weight: 700; text-shadow: 0 2px 10px rgba(0,0,0,0.1);">חשבונית</h1>
                  <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 10px 0 0 0;">חשבונית מס' {{invoiceNumber}} 📄</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px; direction: rtl; text-align: right;">
                  <!-- Invoice Header -->
                  <div style="display: flex; justify-content: space-between; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb;">
                    <div>
                      <h3 style="color: #1f2937; margin: 0 0 10px 0; font-size: 18px;">Bill To:</h3>
                      <p style="margin: 0; color: #6b7280; line-height: 1.5;">{{customerName}}<br>{{customerAddress}}</p>
                    </div>
                    <div style="text-align: left;">
                      <h3 style="color: #1f2937; margin: 0 0 10px 0; font-size: 18px;">From:</h3>
                      <p style="margin: 0; color: #6b7280; line-height: 1.5;">iHoogi<br>חברת טכנולוגיה</p>
                    </div>
                  </div>
                  
                  <!-- Invoice Details -->
                  <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-right: 5px solid #dc2626; padding: 25px; border-radius: 15px; margin: 30px 0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                      <div>
                        <p style="margin: 5px 0; color: #374151;"><strong>מספר חשבונית:</strong> {{invoiceNumber}}</p>
                        <p style="margin: 5px 0; color: #374151;"><strong>תאריך:</strong> {{invoiceDate}}</p>
                        <p style="margin: 5px 0; color: #374151;"><strong>תאריך תשלום:</strong> {{dueDate}}</p>
                      </div>
                      <div style="text-align: left;">
                        <p style="margin: 5px 0; color: #374151;"><strong>סטטוס:</strong> {{status}}</p>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Items Table -->
                  <div style="margin: 30px 0;">
                    <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">פרטי החשבונית</h3>
                    <div style="border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
                      <div style="background: #f9fafb; padding: 15px; border-bottom: 1px solid #e5e7eb;">
                        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 15px; text-align: center; font-weight: 700;">
                          <div>תיאור</div>
                          <div>כמות</div>
                          <div>מחיר יחידה</div>
                          <div>סה"כ</div>
                        </div>
                      </div>
                      <div style="padding: 15px;">
                        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 15px; text-align: center; align-items: center;">
                          <div style="text-align: right;">{{itemDescription}}</div>
                          <div>{{quantity}}</div>
                          <div>{{unitPrice}}</div>
                          <div style="font-weight: 700;">{{lineTotal}}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Total -->
                  <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-right: 5px solid #2563eb; padding: 25px; border-radius: 15px; margin: 30px 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 20px; font-weight: 700; color: #1e40af;">
                      <span>סך הכל לתשלום:</span>
                      <span style="font-size: 24px;">{{totalAmount}}</span>
                    </div>
                  </div>
                  
                  <!-- Payment Info -->
                  <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-right: 5px solid #f59e0b; padding: 20px; border-radius: 15px; margin: 30px 0;">
                    <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px;">💳 פרטי תשלום</h3>
                    <p style="margin: 0; color: #92400e; font-size: 15px; line-height: 1.6;">
                      {{paymentInstructions}}
                    </p>
                  </div>
                  
                  <p style="font-size: 15px; color: #6b7280; margin-top: 30px; text-align: center; line-height: 1.6;">
                    תודה על העסקה! 🙏<br>
                    iHoogi כאן בשבילכם
                  </p>
                </div>
                
                <!-- Footer -->
                <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-top: 2px solid #e5e7eb; padding: 30px; text-align: center;">
                  <p style="color: #9ca3af; font-size: 13px; margin: 10px 0 0 0;">© 2024 iHoogi - הפלטפורמה החכמה ליצירת שאלונים. כל הזכויות שמורות.</p>
                  <p style="color: #d1d5db; font-size: 12px; margin: 5px 0 0 0;">נוצר עם ❤️ על ידי צוות iHoogi</p>
                </div>
                
              </div>
            </div>
          </body>
          </html>
        `,
        textContent: `
          חשבונית - iHoogi
          
          שלום {{customerName}},
          
          מצורפת חשבונית מספר {{invoiceNumber}}
          
          פרטי החשבונית:
          - מספר חשבונית: {{invoiceNumber}}
          - תאריך: {{invoiceDate}}
          - תאריך תשלום: {{dueDate}}
          - סטטוס: {{status}}
          
          פרטי החשבונית:
          - תיאור: {{itemDescription}}
          - כמות: {{quantity}}
          - מחיר יחידה: {{unitPrice}}
          - סה"כ: {{lineTotal}}
          
          סך הכל לתשלום: {{totalAmount}}
          
          פרטי תשלום:
          {{paymentInstructions}}
          
          תודה על העסקה!
          
          © 2024 iHoogi. כל הזכויות שמורות.
        `,
        variables: ["customerName", "customerAddress", "invoiceNumber", "invoiceDate", "dueDate", "status", "itemDescription", "quantity", "unitPrice", "lineTotal", "totalAmount", "paymentInstructions"],
        isActive: true
      }
    ];
    setTemplates(defaultTemplates);
  };

  const handleSaveTemplate = () => {
    if (!selectedTemplate) return;
    
    setTemplates(prev => 
      prev.map(template => 
        template.id === selectedTemplate.id ? selectedTemplate : template
      )
    );
    
    setIsEditing(false);
    toast({
      title: "✅ התבנית נשמרה בהצלחה",
      description: `התבנית "${selectedTemplate.name}" עודכנה`,
    });
  };

  const handleAddTemplate = () => {
    if (!newTemplate.name || !newTemplate.type || !newTemplate.subject) {
      toast({
        title: "שגיאה",
        description: "יש למלא את כל השדות החובה",
        variant: "destructive",
      });
      return;
    }

    const template: EmailTemplate = {
      id: Date.now().toString(),
      name: newTemplate.name,
      type: newTemplate.type,
      subject: newTemplate.subject,
      htmlContent: newTemplate.htmlContent,
      textContent: newTemplate.textContent,
      variables: newTemplate.variables,
      isActive: true,
    };

    setTemplates(prev => [...prev, template]);
    setNewTemplate({
      name: "",
      type: "",
      subject: "",
      htmlContent: "",
      textContent: "",
      variables: []
    });
    
    toast({
      title: "✅ תבנית חדשה נוספה",
      description: `התבנית "${template.name}" נוספה בהצלחה`,
    });
  };

  const handleDeleteTemplate = (id: string) => {
    const template = templates.find(t => t.id === id);
    if (template) {
      setTemplates(prev => prev.filter(t => t.id !== id));
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(null);
      }
      toast({
        title: "🗑️ התבנית נמחקה",
        description: `התבנית "${template.name}" נמחקה`,
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "📋 הועתק ללוח",
      description: "התוכן הועתק בהצלחה",
    });
  };

  const templateTypes = [
    { value: "registration", label: "אישור הרשמה" },
    { value: "password-reset", label: "איפוס סיסמה" },
    { value: "support-response", label: "תשובה לתמיכה" },
    { value: "partner-invitation", label: "הזמנת שותף" },
    { value: "newsletter", label: "ניוזלטר" },
    { value: "payment-confirmation", label: "אישור תשלום" },
    { value: "custom", label: "מותאם אישית" }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ניהול תבניות מייל</h1>
        <p className="text-gray-600">צור וערוך תבניות מייל מקצועיות עם עיצוב מותאם ללוגו שלך</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  📧 תבניות קיימות
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() => setNewTemplate({
                    name: "",
                    type: "",
                    subject: "",
                    htmlContent: "",
                    textContent: "",
                    variables: []
                  })}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-sm">{template.name}</h4>
                        <p className="text-xs text-gray-500">{template.subject}</p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                          template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {template.isActive ? 'פעיל' : 'לא פעיל'}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(template.id);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Template Editor */}
        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    ✏️ עריכת תבנית: {selectedTemplate.name}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewMode(!previewMode)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {previewMode ? 'עריכה' : 'תצוגה מקדימה'}
                    </Button>
                    {!isEditing && (
                      <Button
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        ערוך
                      </Button>
                    )}
                    {isEditing && (
                      <Button
                        size="sm"
                        onClick={handleSaveTemplate}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        שמור
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {previewMode ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">תצוגה מקדימה:</h3>
                      <div 
                        className="border rounded-lg p-4 bg-gray-50"
                        dangerouslySetInnerHTML={{ __html: selectedTemplate.htmlContent }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(selectedTemplate.htmlContent)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        העתק HTML
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(selectedTemplate.textContent)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        העתק טקסט
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="basic">פרטים בסיסיים</TabsTrigger>
                      <TabsTrigger value="html">תוכן HTML</TabsTrigger>
                      <TabsTrigger value="text">תוכן טקסט</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="basic" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="template-name">שם התבנית</Label>
                          <Input
                            id="template-name"
                            value={selectedTemplate.name}
                            onChange={(e) => setSelectedTemplate({
                              ...selectedTemplate,
                              name: e.target.value
                            })}
                            disabled={!isEditing}
                          />
                        </div>
                        <div>
                          <Label htmlFor="template-type">סוג התבנית</Label>
                          <Select
                            value={selectedTemplate.type}
                            onValueChange={(value) => setSelectedTemplate({
                              ...selectedTemplate,
                              type: value
                            })}
                            disabled={!isEditing}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {templateTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="template-subject">נושא המייל</Label>
                        <Input
                          id="template-subject"
                          value={selectedTemplate.subject}
                          onChange={(e) => setSelectedTemplate({
                            ...selectedTemplate,
                            subject: e.target.value
                          })}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label>משתנים זמינים</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedTemplate.variables.map((variable) => (
                            <span
                              key={variable}
                              className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                            >
                              {`{{${variable}}}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="html" className="space-y-4">
                      <div>
                        <Label htmlFor="html-content">תוכן HTML</Label>
                        <Textarea
                          id="html-content"
                          value={selectedTemplate.htmlContent}
                          onChange={(e) => setSelectedTemplate({
                            ...selectedTemplate,
                            htmlContent: e.target.value
                          })}
                          disabled={!isEditing}
                          rows={20}
                          className="font-mono text-sm"
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="text" className="space-y-4">
                      <div>
                        <Label htmlFor="text-content">תוכן טקסט</Label>
                        <Textarea
                          id="text-content"
                          value={selectedTemplate.textContent}
                          onChange={(e) => setSelectedTemplate({
                            ...selectedTemplate,
                            textContent: e.target.value
                          })}
                          disabled={!isEditing}
                          rows={15}
                          className="font-mono text-sm"
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="text-6xl mb-4">📧</div>
                  <h3 className="text-xl font-semibold mb-2">בחר תבנית לעריכה</h3>
                  <p className="text-gray-600">לחץ על תבנית מהרשימה כדי להתחיל לערוך</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailTemplates;
