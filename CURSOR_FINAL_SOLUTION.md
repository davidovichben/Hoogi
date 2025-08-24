# 🚀 **פתרון סופי לבעיות הטרמינל והשרת**

## ✅ **מה שתוקן:**

### 1. **Git Bash כטרמינל ברירת מחדל**
- קובץ `.vscode/settings.json` נוצר
- אכיפת UTF-8 מופעלת
- סימון תווים נסתרים מופעל

### 2. **פורט יציב עם fallback**
- `package.json` עודכן עם `--strictPort false`
- `vite.config.ts` כבר מוגדר נכון
- השרת יעלה על פורט פנוי אם 8080 תפוס

### 3. **בדיקת בריאות אוטומטית**
- `scripts/health-check.js` נוצר
- בודק שהשרת באמת מגיב
- תומך בפורטים 8080, 5173, 3000

### 4. **משימות Cursor**
- `.cursor/tasks.json` נוצר
- משימה לפתיחת Git Bash נקי
- משימה לבדיקת בריאות

## 🎯 **איך להשתמש עכשיו:**

### **בחר את הטרמינל הנכון:**
1. פתח Cursor
2. לחץ `Ctrl + Shift + P`
3. בחר "Terminal: Select Default Profile"
4. בחר "Git Bash"

### **הרץ את השרת:**
```bash
npm run dev
```

### **בדוק בריאות:**
```bash
node scripts/health-check.js
```

## 🔧 **פקודות Git לפתרון סופי:**
```bash
git config --global core.autocrlf input
git config --global i18n.commitEncoding utf-8
git config --global i18n.logOutputEncoding utf-8
```

## 📋 **משימות Cursor זמינות:**
- **Open Clean Git Bash** - טרמינל נקי
- **Dev + Health Check** - הפעלת שרת + בדיקה
- **Health Check Only** - בדיקת בריאות בלבד

## 🎉 **תוצאה:**
- ✅ אין יותר תווים עבריים בפקודות
- ✅ השרת עולה על פורט יציב
- ✅ בדיקה אוטומטית שהכל עובד
- ✅ פונקציונליות טיוטות זמינה

---
**סטטוס:** כל הבעיות נפתרו לצמיתות! 🚀



