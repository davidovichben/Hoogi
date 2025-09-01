import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const ThankYou = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4" dir="rtl">
      <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
      <h1 className="text-4xl font-bold mb-2">תודה רבה!</h1>
      <p className="text-lg text-muted-foreground mb-6">התשובות שלך נשלחו בהצלחה.</p>
      <Link
        to="/"
        className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        חזרה לדף הבית
      </Link>
    </div>
  );
};

export default ThankYou;
