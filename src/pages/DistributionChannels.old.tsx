import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Share2, Mail, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { buildPublicUrl } from "@/lib/publicUrl";
import { QRModal } from "@/components/QRModal";

interface Questionnaire {
  id: string;
  title: string;
  public_token: string;
  default_lang: "he" | "en";
  meta: {
    brand_logo_url?: string;
    brand_primary_color?: string;
  };
}

export default function DistributionChannels() {
  const { id } = useParams<{ id: string }>();
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chosenLang, setChosenLang] = useState<"he" | "en">("he");
  const [refText, setRefText] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const fetchQuestionnaire = async () => {
      try {
        setLoading(true);
        
        const { data, error: fetchError } = await supabase
          .from("questionnaires")
          .select("*")
          .eq("id", id)
          .single();
        
        if (fetchError) throw fetchError;
        if (!data) throw new Error("Questionnaire not found");
        
        setQuestionnaire(data);
        setChosenLang(data.default_lang || "he");
        
      } catch (err: any) {
        setError(err.message || "Failed to load questionnaire");
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuestionnaire();
  }, [id]);

  const shareUrl = questionnaire ? buildPublicUrl(questionnaire.public_token, chosenLang, refText) : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`שאלון: ${questionnaire?.title || ""}\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleEmail = () => {
    const subject = encodeURIComponent("שאלון");
    const body = encodeURIComponent(`היי,\n\nנשמח שתמלאו שאלון קצר:\n${shareUrl}\n\nתודה רבה`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">טוען...</p>
        </div>
      </div>
    );
  }

  if (error || !questionnaire) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <h1 className="text-2xl font-bold mb-4">שגיאה</h1>
          <p>{error || "Questionnaire not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-4">
            {questionnaire.meta.brand_logo_url && (
              <img 
                src={questionnaire.meta.brand_logo_url} 
                alt="Logo" 
                className="h-16 w-16 object-contain"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold">{questionnaire.title}</h1>
              <p className="text-gray-600">ערוץ הפצה ושיתוף</p>
            </div>
          </div>
        </div>

        {/* Language and Reference Controls */}
        <Card>
          <CardHeader>
            <CardTitle>הגדרות שיתוף</CardTitle>
            <CardDescription>בחרי שפה וטקסט הפניה לשיתוף</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  שפת השאלון
                </label>
                <Select value={chosenLang} onValueChange={(value: "he" | "en") => setChosenLang(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="he">עברית</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  טקסט הפניה (אופציונלי)
                </label>
                <Input
                  type="text"
                  value={refText}
                  onChange={(e) => setRefText(e.target.value)}
                  placeholder="למשל: חבר/ה, פרסום, אימייל"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Share Link */}
        <Card>
          <CardHeader>
            <CardTitle>קישור לשיתוף</CardTitle>
            <CardDescription>הקישור הציבורי לשאלון שלך</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1"
              />
              <Button
                onClick={handleCopy}
                variant={copied ? "default" : "outline"}
                className="min-w-[100px]"
              >
                {copied ? "הועתק!" : "העתק"}
                <Copy className="h-4 w-4 mr-2" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleWhatsApp} variant="outline" className="bg-green-50 hover:bg-green-100">
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
              <Button onClick={handleEmail} variant="outline" className="bg-blue-50 hover:bg-blue-100">
                <Mail className="h-4 w-4 mr-2" />
                אימייל
              </Button>
              <Button onClick={() => setShowQR(true)} variant="outline" className="bg-purple-50 hover:bg-purple-100">
                <Share2 className="h-4 w-4 mr-2" />
                QR Code
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* QR Code Modal */}
        <QRModal
          isOpen={showQR}
          onClose={() => setShowQR(false)}
          value={shareUrl}
          title="QR Code"
        />

        {/* Additional Distribution Tips */}
        <Card>
          <CardHeader>
            <CardTitle>טיפים להפצה</CardTitle>
            <CardDescription>איך להפיץ את השאלון שלך ביעילות</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">שיתוף ברשתות חברתיות</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• העתיקי את הקישור ופרסמי בפייסבוק</li>
                  <li>• שלחי ב-WhatsApp לקבוצות רלוונטיות</li>
                  <li>• פרסמי באינסטגרם עם קישור בביוגרפיה</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">שיתוף ישיר</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• שלחי אימייל לרשימת תפוצה</li>
                  <li>• הדפיסי QR Code ופרסמי במקומות פיזיים</li>
                  <li>• הוסיפי קישור לחתימת אימייל</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

