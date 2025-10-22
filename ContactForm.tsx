
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import Tooltip from "@/components/Tooltip";
import FormField from "@/components/FormField";

interface ContactFormProps {
  onBack: () => void;
}

interface ContactFormData {
  subject: string;
  name: string;
  email: string;
  message: string;
  file: File | null;
  url: string;
}

// Email routing map
const emailRoutingMap: Record<string, string> = {
  "תמיכה טכנית": "support@example.com",
  "שירות לקוחות": "service@example.com",
  "בעיה בתשלום": "billing@example.com",
  "דיווח על באג": "bugs@example.com",
  "שאלה כללית": "info@example.com",
  "בקשת פיצ'ר": "features@example.com",
  "משוב על המוצר": "feedback@example.com",
  "שאלה על השימוש": "support@example.com",
  "Technical Support": "support-en@example.com",
  "Customer Service": "service-en@example.com",
  "Billing Issue": "billing-en@example.com",
  "Bug Report": "bugs-en@example.com",
};

// Get subject options based on country
const getSubjectOptionsForCountry = (country: string) => {
  if (country === "USA") {
    return [
      { value: "Technical Support", label: "Technical Support" },
      { value: "Customer Service", label: "Customer Service" },
      { value: "Billing Issue", label: "Billing Issue" },
      { value: "Bug Report", label: "Bug Report" },
    ];
  } else {
    // Default to Hebrew for Israel and other countries
    return [
      { value: "תמיכה טכנית", label: "תמיכה טכנית" },
      { value: "שירות לקוחות", label: "שירות לקוחות" },
      { value: "בעיה בתשלום", label: "בעיה בתשלום" },
      { value: "דיווח על באג", label: "דיווח על באג" },
      { value: "בקשת פיצ'ר", label: "בקשת פיצ'ר" },
      { value: "משוב על המוצר", label: "משוב על המוצר" },
      { value: "שאלה על השימוש", label: "שאלה על השימוש" },
      { value: "שאלה כללית", label: "שאלה כללית" }
    ];
  }
};

// Available countries
const availableCountries = [
  { value: "ישראל", label: "ישראל" },
  { value: "USA", label: "USA" },
  { value: "UK", label: "UK" },
  { value: "קנדה", label: "קנדה" },
  { value: "אוסטרליה", label: "אוסטרליה" },
];

const ContactForm = ({ onBack }: ContactFormProps) => {
  const [formData, setFormData] = useState<ContactFormData>({
    subject: "",
    name: "",
    email: "",
    message: "",
    file: null,
    url: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [userCountry, setUserCountry] = useState<string>("ישראל");

  // Detect user country on component mount
  useEffect(() => {
    // Simple country detection based on language
    const browserLang = navigator.language || navigator.languages?.[0] || 'he';
    if (browserLang.startsWith('he') || browserLang.startsWith('ar')) {
      setUserCountry("ישראל");
    } else if (browserLang.startsWith('en')) {
      setUserCountry("USA");
    } else {
      setUserCountry("ישראל"); // Default
    }
  }, []);

  const handleChange = (field: keyof ContactFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (file: File | null) => {
    handleChange("file", file);
    
    // Clear previous preview
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
    
    // Generate preview for images and videos
    if (file) {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const previewUrl = URL.createObjectURL(file);
        setFilePreview(previewUrl);
      }
    }
  };

  const validateForm = (): boolean => {
    // Basic validation
    if (!formData.subject) {
      toast({
        title: "שגיאה",
        description: "יש לבחור נושא לפנייה",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.name) {
      toast({
        title: "שגיאה",
        description: "יש להזין שם מלא",
        variant: "destructive",
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "שגיאה",
        description: "יש להזין כתובת אימייל תקינה",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.message.trim()) {
      toast({
        title: "שגיאה",
        description: "יש להזין תיאור לפנייה",
        variant: "destructive",
      });
      return false;
    }

    // URL validation if provided
    if (formData.url && !formData.url.startsWith('http')) {
      toast({
        title: "שגיאה",
        description: "יש להזין כתובת URL תקינה",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    // Get the target email from the mapping
    const targetEmail = emailRoutingMap[formData.subject] || "info@example.com";

    // Simulate API call with timeout
    setTimeout(() => {
      console.log("Sending contact email:", {
        ...formData,
        targetEmail,
        fileSize: formData.file ? `${(formData.file.size / 1024 / 1024).toFixed(2)} MB` : null,
      });
      
      toast({
        title: "🎉 הפנייה נשלחה בהצלחה!",
        description: "הפנייה שלך נשלחה לצוות המתאים. נחזור אליך בהקדם האפשרי.",
      });
      
      // Clean up preview URL
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
        setFilePreview(null);
      }
      
      // Reset form
      setFormData({
        subject: "",
        name: "",
        email: "",
        message: "",
        file: null,
        url: "",
      });
      
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="max-w-lg mx-auto w-full py-4 px-2">
      <div className="flex justify-center mb-4">
        <img 
          src="/hoogi-new-avatar.png" 
          alt="iHoogi Avatar" 
          className="w-[140px] h-[140px] object-contain" 
        />
      </div>

      <h1 className="text-xl md:text-2xl font-bold text-center mb-6">צור קשר עם התמיכה שלנו</h1>

      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            {/* Country Selection */}
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="country" className="text-base font-medium">מדינה</Label>
                <Tooltip content="בחר את המדינה שלך כדי לראות נושאים בשפה המתאימה" />
              </div>
              <Select value={userCountry} onValueChange={setUserCountry}>
                <SelectTrigger id="country" className="w-full">
                  <SelectValue placeholder="בחר מדינה" />
                </SelectTrigger>
                <SelectContent>
                  {availableCountries.map((country) => (
                    <SelectItem key={country.value} value={country.value}>
                      {country.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <FormField
              id="subject"
              label="נושא הפנייה"
              type="select"
              value={formData.subject}
              onChange={(value) => handleChange("subject", value)}
              tooltip="בחר נושא כדי לנתב את הפנייה"
              options={getSubjectOptionsForCountry(userCountry)}
            />

            <FormField
              id="name"
              label="שם מלא"
              type="text"
              value={formData.name}
              onChange={(value) => handleChange("name", value)}
              tooltip="הזן את שמך המלא"
            />

            <FormField
              id="email"
              label="אימייל ליצירת קשר"
              type="text"
              value={formData.email}
              onChange={(value) => handleChange("email", value)}
              tooltip="הזן כתובת אימייל תקינה לתשובה"
            />

            <FormField
              id="message"
              label="תיאור הפנייה"
              type="textarea"
              value={formData.message}
              onChange={(value) => handleChange("message", value)}
              tooltip="תאר את הפנייה שלך בפירוט"
            />
            
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="file" className="text-base font-medium">צרף תמונה או סרטון</Label>
                <Tooltip content="ניתן לצרף תמונות (PNG, JPG), סרטונים (MP4, MOV, WEBM) או מסמכים (PDF)" />
              </div>
              <Input
                id="file"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.mp4,.mov,.avi,.webm"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  handleFileChange(file);
                }}
                className="flex-1"
              />
              {formData.file && (
                <div className="mt-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  {/* File info header */}
                  <div className="p-3 bg-white/80 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                          {formData.file.type.startsWith('image/') && (
                            <span className="text-lg">🖼️</span>
                          )}
                          {formData.file.type.startsWith('video/') && (
                            <span className="text-lg">🎥</span>
                          )}
                          {formData.file.type === 'application/pdf' && (
                            <span className="text-lg">📄</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{formData.file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFileChange(null)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full w-8 h-8 p-0"
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                  
                  {/* Preview section */}
                  {(filePreview && (formData.file.type.startsWith('image/') || formData.file.type.startsWith('video/'))) && (
                    <div className="p-3 bg-white">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <p className="text-xs text-gray-600 font-medium">תצוגה מקדימה</p>
                      </div>
                      
                      {/* Image preview */}
                      {formData.file.type.startsWith('image/') && (
                        <div className="relative">
                          <img 
                            src={filePreview} 
                            alt="Preview" 
                            className="w-full max-h-48 object-contain rounded-lg border border-gray-200 bg-white shadow-sm"
                          />
                          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                            תמונה
                          </div>
                        </div>
                      )}
                      
                      {/* Video preview */}
                      {formData.file.type.startsWith('video/') && (
                        <div className="relative">
                          <video 
                            src={filePreview} 
                            controls 
                            className="w-full max-h-48 rounded-lg border border-gray-200 bg-black shadow-sm"
                          />
                          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                            סרטון
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <FormField
              id="url"
              label="קישור (אופציונאלי)"
              type="text"
              value={formData.url}
              onChange={(value) => handleChange("url", value)}
              tooltip="קישור רלוונטי לתיאור הבעיה, אם יש"
              placeholder="https://..."
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4 justify-between pt-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={onBack}
              className="h-10 text-base"
            >
              ⬅️ חזרה
            </Button>
            <Button 
              type="submit"
              className="h-10 bg-[#2D66F2] hover:bg-blue-600 text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? "שולח..." : "שלח"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactForm;
