import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Users, TrendingUp, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Partner {
  id: string;
  name: string;
  ref_code: string;
  status: string;
  created_at: string;
}

interface PartnerStat {
  ref_code: string;
  questionnaire_title: string;
  month: string;
  leads_count: number;
}

export default function Partners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [partnerStats, setPartnerStats] = useState<PartnerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadPartners();
    loadPartnerStats();
  }, []);

  const loadPartners = async () => {
    try {
      setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from("partners")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (fetchError) throw fetchError;
      
      setPartners(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load partners");
    } finally {
      setLoading(false);
    }
  };

  const loadPartnerStats = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("partner_stats")
        .select("*")
        .order("month", { ascending: false });
      
      if (fetchError) {
        console.log("No partner_stats table found");
        return;
      }
      
      setPartnerStats(data || []);
    } catch (err) {
      console.log("No partner_stats table found");
    }
  };

  const handleCopyRefCode = async (refCode: string) => {
    try {
      await navigator.clipboard.writeText(refCode);
      toast({
        title: "הועתק!",
        description: "קוד ההפניה הועתק ללוח",
      });
    } catch (err) {
      toast({
        title: "שגיאה",
        description: "לא ניתן היה להעתיק את קוד ההפניה",
        variant: "destructive",
      });
    }
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <h1 className="text-2xl font-bold mb-4">שגיאה</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-4">
            <Users className="h-12 w-12 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">שותפים</h1>
              <p className="text-gray-600">ניהול שותפים וסטטיסטיקות הפצה</p>
            </div>
          </div>
        </div>

        {/* Partners List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>רשימת שותפים</span>
            </CardTitle>
            <CardDescription>
              כל השותפים הרשומים במערכת
            </CardDescription>
          </CardHeader>
          <CardContent>
            {partners.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right p-3 font-medium">שם</th>
                      <th className="text-right p-3 font-medium">קוד הפניה</th>
                      <th className="text-right p-3 font-medium">סטטוס</th>
                      <th className="text-right p-3 font-medium">תאריך הצטרפות</th>
                      <th className="text-right p-3 font-medium">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners.map((partner) => (
                      <tr key={partner.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{partner.name}</td>
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                              {partner.ref_code}
                            </code>
                            <Button
                              onClick={() => handleCopyRefCode(partner.ref_code)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            partner.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {partner.status === 'active' ? 'פעיל' : 'לא פעיל'}
                          </span>
                        </td>
                        <td className="p-3">
                          {new Date(partner.created_at).toLocaleDateString('he-IL')}
                        </td>
                        <td className="p-3">
                          <Button variant="outline" size="sm">
                            צפייה בפרטים
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">אין שותפים רשומים עדיין</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Partner Statistics */}
        {partnerStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>סטטיסטיקות שותפים</span>
              </CardTitle>
              <CardDescription>
                ביצועי השותפים לפי שאלונים וחודשים
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right p-3 font-medium">קוד הפניה</th>
                      <th className="text-right p-3 font-medium">שם השאלון</th>
                      <th className="text-right p-3 font-medium">חודש</th>
                      <th className="text-right p-3 font-medium">מספר לידים</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partnerStats.map((stat, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                            {stat.ref_code}
                          </code>
                        </td>
                        <td className="p-3">{stat.questionnaire_title}</td>
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span>{stat.month}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-blue-600">
                            {stat.leads_count}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attribution Note */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">איך להשתמש בקודי הפניה</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-blue-700">
              <p>
                כדי לייחס ליד לשותף ספציפי, הוסיפי את קוד ההפניה שלו לקישור השאלון:
              </p>
              <div className="bg-white p-3 rounded border border-blue-300">
                <code className="text-sm">
                  https://yourdomain.com/q/TOKEN?ref=REF_CODE
                </code>
              </div>
              <p className="text-sm">
                לדוגמה: אם קוד ההפניה הוא "PARTNER123", הקישור יהיה:
              </p>
              <div className="bg-white p-3 rounded border border-blue-300">
                <code className="text-sm">
                  https://yourdomain.com/q/abc123?ref=PARTNER123
                </code>
              </div>
              <p className="text-sm font-medium">
                כל ליד שיגיע דרך הקישור הזה ייחשב לשותף המסוים!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
