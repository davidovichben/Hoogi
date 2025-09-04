export function safeToast(type: "success" | "warning" | "error", message: string) {
  try {
    // אם יש ספריית toast גלובלית – קרא אליה כאן
    console.log(`TOAST [${type}]:`, message);
  } catch {
    // fallback אם אין toast system
    console.log(`TOAST [${type}]:`, message);
  }
}
