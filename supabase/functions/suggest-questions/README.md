# suggest-questions
Edge Function שמציעה שאלות מוצעות לפי תחום עסקי.

## שימוש

```bash
curl -X POST https://lcazbaggfdejukjgkpeu.supabase.co/functions/v1/suggest-questions \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -d '{
    "businessName": "בדיקה",
    "occupation": "עריכת דין",
    "suboccupation": "דיני עבודה",
    "language": "he",
    "max": 5
  }'
```

## פרמטרים

- `businessName` (חובה): שם העסק
- `occupation` (חובה): התחום העסקי
- `suboccupation` (אופציונלי): תת-תחום
- `language` (אופציונלי): שפה (ברירת מחדל: "he")
- `max` (אופציונלי): מספר מקסימלי של שאלות (ברירת מחדל: 5)

## תגובה

```json
{
  "success": true,
  "businessName": "בדיקה",
  "occupation": "עריכת דין",
  "suboccupation": "דיני עבודה",
  "language": "he",
  "questions": [
    {
      "id": "עריכת-דין-1-1234567890",
      "text": "מה סוג הבעיה המשפטית שלך?",
      "type": "single_choice",
      "options": ["דיני עבודה", "מקרקעין", "דיני משפחה", "מסחרי/חוזים", "אחר"],
      "isRequired": true
    }
  ],
  "count": 1
}
```

## תחומים נתמכים

- עריכת דין
- ראיית חשבון / הנהלת חשבונות
- ביטוח
- נדל״ן ושיווק פרויקטים
- בנייה ושיפוצים
- אדריכלות ועיצוב פנים
- רפואה וקליניקות
- כושר ולייפסטייל
- יופי וקוסמטיקה
- צילום וקריאייטיב
- מסעדנות וקייטרינג
- איקומרס וסחר
- שיווק וייעוץ עסקי
- שירותי תוכנה/IT
- חינוך והכשרות
- רכב ותחבורה
- תיירות ואירוח
- עמותות ומלכ״רים
