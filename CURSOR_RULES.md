# 🚫 CURSOR AI - חוקים קבועים למניעת בעיות טרמינל

## ⚠️ הבעיה:
הטרמינל מוסיף תווים עבריים לפקודות (בnpx, ץnode, בgit)

## ✅ הפתרון - פקודות בטוחות:

### 1. TypeScript Compilation:
```bash
# ❌ לא לעשות:
npx tsc --noEmit

# ✅ לעשות:
node_modules\.bin\tsc --noEmit
```

### 2. Vite Dev Server:
```bash
# ❌ לא לעשות:
npx vite --host --port 8080

# ✅ לעשות:
node_modules\.bin\vite --host --port 8080
```

### 3. NPM Scripts:
```bash
# ❌ לא לעשות:
npm run dev

# ✅ לעשות:
node scripts\find-port-and-run.mjs
```

### 4. Git Commands:
```bash
# ❌ לא לעשות:
git status

# ✅ לעשות:
# השתמש ב-Git Bash או PowerShell נקי
```

## 🔧 כלים לבדיקה מהירה:

### בדיקת TypeScript:
```bash
node_modules\.bin\tsc --noEmit
```

### הפעלת Dev Server:
```bash
node_modules\.bin\vite --host --port 8080
```

### בדיקת Build:
```bash
node_modules\.bin\vite build
```

## 📝 כללים כלליים:
1. תמיד השתמש בנתיב מלא ל-node_modules
2. הימנע מ-npx אם יש בעיות
3. בדוק את הפקודה לפני הרצה
4. אם יש בעיה - השתמש בנתיב יחסי מלא

## 🚨 במקרה של בעיה:
```bash
# נקה את הטרמינל
cls

# התחל מחדש
cd "C:\dev\hoogi-answer qa"

# הרץ פקודה בטוחה
node_modules\.bin\tsc --noEmit
```

## 🌐 **מידע על השרת הנוכחי:**
- **השרת עולה בהצלחה!** ✅
- **פורט נוכחי:** 8082 (כי 8080 ו-8081 תפוסים)
- **כתובת מקומית:** http://localhost:8082/
- **פקודה להפעלה:** `node_modules\.bin\vite --host --port 8080`

## 📋 **פקודות מהירות לבדיקה:**
```bash
# בדיקת TypeScript
node_modules\.bin\tsc --noEmit

# הפעלת שרת
node_modules\.bin\vite --host --port 8080

# בדיקת פורטים תפוסים
netstat -an | findstr :808
```

---
**מטרה:** מניעת בעיות טרמינל עם תווים עבריים
**לשימוש ב-Cursor AI**
**סטטוס:** השרת עובד על פורט 8082 ✅
