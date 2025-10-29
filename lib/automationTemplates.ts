// lib/automationTemplates.ts
// Email template generation functions for automation previews

interface ThankYouEmailParams {
  firstName: string;
  businessName: string;
  questionnaireTitle: string;
  logoUrl?: string;
  profileImageUrl?: string;
  personalMessage?: string;
}

interface ReminderEmailParams {
  firstName: string;
  businessName: string;
  questionnaireTitle: string;
  logoUrl?: string;
  profileImageUrl?: string;
  timeLeft?: string;
}

interface UserBranding {
  businessName?: string;
  logoUrl?: string;
  profileImageUrl?: string;
}

export function getUserBranding(): UserBranding {
  // In a real app, this would fetch from user profile
  // For preview purposes, return mock data
  return {
    businessName: "העסק שלי",
    logoUrl: undefined,
    profileImageUrl: undefined
  };
}

export function generateQuestionnaireThankYouEmail(params: ThankYouEmailParams): string {
  const { firstName, businessName, questionnaireTitle, logoUrl, profileImageUrl, personalMessage } = params;

  return `
    <div style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;" dir="rtl">
      <!-- Top Banner -->
      <div style="background: linear-gradient(135deg, #199f3a15 0%, #199f3a08 100%); padding: 16px 24px; border-bottom: 2px solid #199f3a20; display: flex; align-items: center; justify-content: space-between;">
        ${logoUrl ? `
        <div style="flex-shrink: 0;">
          <img src="${logoUrl}" alt="Logo" style="height: 48px; width: 48px; object-fit: contain;" />
        </div>
        ` : '<div></div>'}
        <div style="text-align: left; flex-grow: 1; padding-left: 16px;">
          ${businessName ? `
          <h2 style="margin: 0 0 4px 0; font-size: 20px; font-weight: bold; color: #199f3a; line-height: 1.2;">
            ${businessName}
          </h2>
          ` : ''}
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #16a34a;">
            פנייתך התקבלה – הצוות שלנו כבר מטפל בה.
          </p>
        </div>
      </div>

      <!-- Content -->
      <div style="padding: 24px; background-color: #fafafa;">
        <div style="font-size: 14px; line-height: 1.6; color: #1f2937; text-align: right;">
          ${personalMessage || `שלום ${firstName},<br><br>תודה רבה על המענה ושהקדשת את הזמן! 👍`}
        </div>
      </div>

      <!-- Bottom Banner -->
      <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); padding: 20px 24px; border-top: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between;">
        ${logoUrl ? `
        <div style="flex-shrink: 0; padding-left: 16px;">
          <img src="${logoUrl}" alt="Logo" style="height: 48px; width: 48px; object-fit: contain;" />
        </div>
        ` : '<div></div>'}
        <div style="text-align: ${profileImageUrl ? 'center' : 'left'}; flex-grow: 1;">
          ${businessName ? `
          <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #1f2937;">
            ${businessName}
          </p>
          ` : ''}
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #16a34a;">
            בברכה
          </p>
        </div>
        ${profileImageUrl ? `
        <div style="flex-shrink: 0; padding-right: 16px;">
          <img src="${profileImageUrl}" alt="Profile" style="height: 48px; width: 48px; object-fit: cover; border-radius: 50%;" />
        </div>
        ` : '<div></div>'}
      </div>
    </div>
  `;
}

export function generateQuestionnaireReminderEmail(params: ReminderEmailParams): string {
  const { firstName, businessName, questionnaireTitle, logoUrl, profileImageUrl, timeLeft } = params;

  return `
    <div style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;" dir="rtl">
      <!-- Top Banner -->
      <div style="background: linear-gradient(135deg, #fb923c15 0%, #fb923c08 100%); padding: 16px 24px; border-bottom: 2px solid #fb923c20; display: flex; align-items: center; justify-content: space-between;">
        ${logoUrl ? `
        <div style="flex-shrink: 0;">
          <img src="${logoUrl}" alt="Logo" style="height: 48px; width: 48px; object-fit: contain;" />
        </div>
        ` : '<div></div>'}
        <div style="text-align: left; flex-grow: 1; padding-left: 16px;">
          ${businessName ? `
          <h2 style="margin: 0 0 4px 0; font-size: 20px; font-weight: bold; color: #ea580c; line-height: 1.2;">
            ${businessName}
          </h2>
          ` : ''}
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #ea580c;">
            תזכורת – אנחנו מחכים לתשובה שלך 🔔
          </p>
        </div>
      </div>

      <!-- Content -->
      <div style="padding: 24px; background-color: #fafafa;">
        <div style="font-size: 14px; line-height: 1.6; color: #1f2937; text-align: right;">
          שלום ${firstName},<br><br>
          רצינו להזכיר לך שעדיין לא קיבלנו את התשובה שלך ל${questionnaireTitle}.<br><br>
          ${timeLeft ? `יש לך עוד ${timeLeft} כדי למלא את השאלון.` : 'נשמח אם תוכל/י להשלים את השאלון בהקדם.'}<br><br>
          תודה! 🙏
        </div>
      </div>

      <!-- Bottom Banner -->
      <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); padding: 20px 24px; border-top: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between;">
        ${logoUrl ? `
        <div style="flex-shrink: 0; padding-left: 16px;">
          <img src="${logoUrl}" alt="Logo" style="height: 48px; width: 48px; object-fit: contain;" />
        </div>
        ` : '<div></div>'}
        <div style="text-align: ${profileImageUrl ? 'center' : 'left'}; flex-grow: 1;">
          ${businessName ? `
          <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #1f2937;">
            ${businessName}
          </p>
          ` : ''}
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #16a34a;">
            בברכה
          </p>
        </div>
        ${profileImageUrl ? `
        <div style="flex-shrink: 0; padding-right: 16px;">
          <img src="${profileImageUrl}" alt="Profile" style="height: 48px; width: 48px; object-fit: cover; border-radius: 50%;" />
        </div>
        ` : '<div></div>'}
      </div>
    </div>
  `;
}
