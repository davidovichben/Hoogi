import toast from "react-hot-toast";

// יוטיליטי אחיד לטוסטים עם react-hot-toast
export const showSuccess = (msg: string) => toast.success(msg);
export const showError = (msg: string) => toast.error(msg);
export const showInfo = (msg: string) => toast(msg);

// תאימות לאחור עם safeToast
export function safeToast(type: "success" | "warning" | "error", message: string) {
  try {
    switch (type) {
      case "success":
        showSuccess(message);
        break;
      case "warning":
        showInfo(message); // משתמש ב-info לאזהרות
        break;
      case "error":
        showError(message);
        break;
    }
  } catch (error) {
    // fallback אם אין toast system
    console.log(`TOAST [${type}]:`, message);
    if (type === "error") {
      alert(`שגיאה: ${message}`);
    } else {
      alert(message);
    }
  }
}