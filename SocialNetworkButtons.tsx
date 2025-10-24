import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Facebook, 
  Instagram, 
  Linkedin, 
  Youtube, 
  Send,
  Globe,
  Smartphone,
  Mail,
  Share2,
  BarChart3
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SocialNetworkButtonsProps {
  baseUrl: string;
  surveyId?: string;
  onLinkGenerated?: (url: string, network: string) => void;
}

interface NetworkStats {
  [key: string]: number;
}

const SocialNetworkButtons = ({ baseUrl, surveyId, onLinkGenerated }: SocialNetworkButtonsProps) => {
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    whatsapp: 0,
    facebook: 0,
    instagram: 0,
    linkedin: 0,
    youtube: 0,
    telegram: 0,
    email: 0,
    sms: 0,
    website: 0
  });

  // הגדרת הרשתות לפי הרלוונטיות שלך
  const networks = [
    {
      id: "whatsapp",
      name: "WhatsApp",
      icon: <MessageCircle className="h-5 w-5" />,
      color: "bg-green-500 hover:bg-green-600",
      textColor: "text-white",
      priority: 1,
      description: "הכי ממיר בישראל",
      clickRate: "45-60%"
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: <Facebook className="h-5 w-5" />,
      color: "bg-blue-600 hover:bg-blue-700",
      textColor: "text-white",
      priority: 2,
      description: "תמיד עובד טוב",
      clickRate: "25-35%"
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: <Instagram className="h-5 w-5" />,
      color: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
      textColor: "text-white",
      priority: 3,
      description: "פופולרי אצל עסקים",
      clickRate: "15-25%"
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: <Linkedin className="h-5 w-5" />,
      color: "bg-blue-700 hover:bg-blue-800",
      textColor: "text-white",
      priority: 4,
      description: "חשוב לעסקים",
      clickRate: "10-18%"
    },
    {
      id: "youtube",
      name: "YouTube",
      icon: <Youtube className="h-5 w-5" />,
      color: "bg-red-600 hover:bg-red-700",
      textColor: "text-white",
      priority: 5,
      description: "אם יש סרטון הדרכה",
      clickRate: "8-12%"
    },
    {
      id: "telegram",
      name: "Telegram",
      icon: <Send className="h-5 w-5" />,
      color: "bg-blue-500 hover:bg-blue-600",
      textColor: "text-white",
      priority: 6,
      description: "מצוין לקהילות",
      clickRate: "8-12%"
    },
    {
      id: "email",
      name: "Email",
      icon: <Mail className="h-5 w-5" />,
      color: "bg-gray-600 hover:bg-gray-700",
      textColor: "text-white",
      priority: 7,
      description: "תמיד עובד",
      clickRate: "8-12%"
    },
    {
      id: "sms",
      name: "SMS",
      icon: <Smartphone className="h-5 w-5" />,
      color: "bg-indigo-600 hover:bg-indigo-700",
      textColor: "text-white",
      priority: 8,
      description: "ישיר ומהיר",
      clickRate: "8-12%"
    },
    {
      id: "website",
      name: "Website",
      icon: <Globe className="h-5 w-5" />,
      color: "bg-gray-500 hover:bg-gray-600",
      textColor: "text-white",
      priority: 9,
      description: "לאתר הראשי",
      clickRate: "5-10%"
    }
  ];

  const generateLink = (network: string) => {
    if (!surveyId) {
      toast.error("בחר שאלון תחילה");
      return;
    }

    const url = `${baseUrl}/form/${surveyId}?src=${network}`;
    
    // העתקה ללוח
    navigator.clipboard.writeText(url);
    
    // עדכון סטטיסטיקות
    setNetworkStats(prev => ({
      ...prev,
      [network]: prev[network] + 1
    }));
    
    // קריאה לפונקציה חיצונית
    if (onLinkGenerated) {
      onLinkGenerated(url, network);
    }
    
    toast.success(`קישור ${networks.find(n => n.id === network)?.name} הועתק ללוח!`);
  };

  const getTotalClicks = () => {
    return Object.values(networkStats).reduce((sum, count) => sum + count, 0);
  };

  const getTopNetworks = () => {
    return networks
      .filter(network => networkStats[network.id] > 0)
      .sort((a, b) => networkStats[b.id] - networkStats[a.id])
      .slice(0, 3);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* כותרת */}
      <Card className="border shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <Share2 className="h-6 w-6 text-blue-600" />
            כפתורי רשתות חברתיות חכמים
          </CardTitle>
          <p className="text-sm text-muted-foreground text-right">
            לחץ על הכפתור הרלוונטי לך - כל קישור כולל מעקב לפי רשת
          </p>
        </CardHeader>
      </Card>

      {/* כפתורים עיקריים (4-5 הראשונים) */}
      <Card className="border shadow-md">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-right">רשתות עיקריות (הכי ממירות)</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {networks.slice(0, 5).map((network) => (
              <div key={network.id} className="text-center">
                <Button
                  onClick={() => generateLink(network.id)}
                  className={`w-full h-16 ${network.color} ${network.textColor} flex flex-col items-center gap-1 hover:shadow-lg transition-all`}
                  disabled={!surveyId}
                >
                  {network.icon}
                  <span className="text-xs font-medium">{network.name}</span>
                </Button>
                <div className="mt-2 text-center">
                  <Badge variant="outline" className="text-xs">
                    {network.clickRate}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {network.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* כפתורים משניים */}
      <Card className="border shadow-md">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-right">רשתות נוספות</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {networks.slice(5).map((network) => (
              <div key={network.id} className="text-center">
                <Button
                  onClick={() => generateLink(network.id)}
                  className={`w-full h-12 ${network.color} ${network.textColor} flex flex-col items-center gap-1 hover:shadow-lg transition-all`}
                  disabled={!surveyId}
                >
                  {network.icon}
                  <span className="text-xs font-medium">{network.name}</span>
                </Button>
                <div className="mt-1 text-center">
                  <Badge variant="secondary" className="text-xs">
                    {network.clickRate}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* סטטיסטיקות */}
      {getTotalClicks() > 0 && (
        <Card className="border shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-right flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                סטטיסטיקות קליקים
              </h3>
              <Badge variant="default" className="text-sm">
                {getTotalClicks()} קליקים סה"כ
              </Badge>
            </div>
            
            <div className="space-y-3">
              {getTopNetworks().map((network, index) => (
                <div key={network.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                    <div className="flex items-center gap-2">
                      {network.icon}
                      <span className="font-medium">{network.name}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    {networkStats[network.id]} קליקים
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* הוראות שימוש */}
      <Card className="border shadow-md bg-blue-50">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-3 text-right text-blue-800">
            💡 איך זה עובד?
          </h3>
          <div className="space-y-2 text-sm text-blue-700 text-right">
            <p>• כל כפתור יוצר קישור ייחודי עם פרמטר מעקב</p>
            <p>• הקישור מועתק אוטומטית ללוח</p>
            <p>• המערכת עוקבת אחרי כמה אנשים הגיעו מכל רשת</p>
            <p>• הנתונים נשמרים ב-Supabase עם מקור ברור</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SocialNetworkButtons;
