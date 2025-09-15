export function safeToast(type: "success" | "warning" | "error", message: string) {
  try {
    // נסה להשתמש ב-Toast גלובלי אם קיים
    if (typeof window !== 'undefined' && (window as any).toast) {
      (window as any).toast({
        title: type === "success" ? "הצלחה" : type === "warning" ? "אזהרה" : "שגיאה",
        description: message,
        variant: type === "error" ? "destructive" : "default"
      });
      return;
    }
    
    // fallback - alert זמני
    if (type === "error") {
      alert(`שגיאה: ${message}`);
    } else {
      alert(message);
    }
  } catch {
    // fallback אם אין toast system
    console.log(`TOAST [${type}]:`, message);
    alert(message);
  }
}
