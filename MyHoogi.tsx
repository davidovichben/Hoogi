import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { FileText, Plus, Users, Edit, Copy, BarChart3, Share2, Calendar, TrendingUp, AlertCircle, Zap, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const MyHoogi = () => {
  const navigate = useNavigate();
  
  // Mock data for questionnaires
  const [questionnaires, setQuestionnaires] = useState([
    {
      id: "q-1",
      title: "שאלון כללא כותרת",
      subtitle: "כללא קטגוריה",
      date: "3.10.2025",
      active: true,
      leads: { total: 0, new: 0 },
      responses: { total: 0, new: 0 },
      sources: [],
      partners: [],
    },
    {
      id: "q-2", 
      title: "שאלון כללא כותרת",
      subtitle: "כללא קטגוריה",
      date: "3.10.2025",
      active: true,
      leads: { total: 0, new: 0 },
      responses: { total: 0, new: 0 },
      sources: [],
      partners: [],
    },
  ]);

  const toggleActive = (id: string) => {
    setQuestionnaires(prev => 
      prev.map(q => q.id === id ? { ...q, active: !q.active } : q)
    );
  };

  // Data for charts
  const networkData = [
    { name: "Facebook", value: 45, color: "#8B5CF6" },
    { name: "Instagram", value: 38, color: "#EC4899" },
    { name: "WhatsApp", value: 25, color: "#10B981" },
    { name: "אתר", value: 30, color: "#3B82F6" },
    { name: "LinkedIn", value: 42, color: "#F59E0B" },
  ];

  const partnerData = [
    { name: "שותף א׳", value: 65, color: "#8B5CF6" },
    { name: "שותף ב׳", value: 52, color: "#EC4899" },
    { name: "שותף ג׳", value: 43, color: "#10B981" },
  ];

  const barChartData = [
    { name: "Facebook", לידים: 45, חדשים: 12 },
    { name: "Instagram", לידים: 38, חדשים: 8 },
    { name: "WhatsApp", לידים: 25, חדשים: 5 },
    { name: "אתר", לידים: 30, חדשים: 7 },
    { name: "LinkedIn", לידים: 42, חדשים: 10 },
  ];

  const CHART_COLORS = {
    primary: "#8B5CF6",
    secondary: "#EC4899",
  };

  return (
    <MainLayout initialState="content">
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 md:p-8" dir="rtl">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Section with Logo and Greeting */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-card/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <img 
                  src="/hoogi-new-avatar.png" 
                  alt="Hoogi Avatar" 
                  className="w-12 h-12 md:w-16 md:h-16 object-contain"
                />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-l from-primary to-primary/60 bg-clip-text text-transparent">
                  שלום יוסי כהן 👋
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground mt-1">
                  העסק שלי: ייעוץ עסקי ושיווק דיגיטלי
                </p>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/create-questionnaire')}
              size="lg"
              className="gap-2 shadow-lg"
            >
              <Plus className="h-5 w-5" />
              שאלון חדש
            </Button>
          </div>

          {/* Compact Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-0 shadow-md bg-gradient-to-br from-primary/10 to-primary/5">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-primary mb-1">180</div>
                <div className="text-xs font-medium text-muted-foreground mb-2">סה"כ לידים שנותרו</div>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-xs px-2 py-1 h-7 border-primary text-primary hover:bg-primary hover:text-white transition-colors"
                  onClick={() => navigate('/profile?tab=subscription')}
                >
                  קניית לידים / שדרוג
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-green-500/10 to-green-500/5">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">120</div>
                <div className="text-xs font-medium text-muted-foreground">סה"כ לידים שנוצלו</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-purple-500/10 to-purple-500/5">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">5</div>
                <div className="text-xs font-medium text-muted-foreground">שאלונים פעילים</div>
              </CardContent>
            </Card>
          </div>


          {/* Leads Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* New Leads Card */}
            <Card 
              className="border border-primary/30 shadow-md bg-gradient-to-l from-primary/5 to-transparent hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate('/leads-responses?filter=new')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-right flex-1">
                    <div className="flex items-baseline gap-2 justify-end mb-1">
                      <span className="text-lg font-semibold text-foreground">לידים חדשים</span>
                      <h3 className="text-4xl font-bold text-foreground">42</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      לחץ כאן לצפייה ולטיפול בלידים החדשים
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    className="gap-2 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/leads-responses?filter=new');
                    }}
                  >
                    <TrendingUp className="h-4 w-4" />
                    צפה ברשימה
                  </Button>
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reminder Leads Card */}
            <Card 
              className="border border-orange-500/30 shadow-md bg-gradient-to-l from-orange-500/5 to-transparent hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate('/leads-responses?filter=reminder')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-right flex-1">
                    <div className="flex items-baseline gap-2 justify-end mb-1">
                      <span className="text-lg font-semibold text-foreground">לידים בתזכורת</span>
                      <h3 className="text-4xl font-bold text-foreground">18</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      תזכורות פעילות הממתינות לטיפול
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="gap-2 flex-shrink-0 border-orange-500/30 hover:bg-orange-500/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/leads-responses?filter=reminder');
                    }}
                  >
                    <Calendar className="h-4 w-4" />
                    לרשימה
                  </Button>
                  <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Visual Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Networks Chart */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-card/50">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">לידים לפי רשת</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pie Chart */}
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={networkData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {networkData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Stats List */}
                  <div className="space-y-2">
                    {networkData.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span className="font-medium text-sm">{item.name}</span>
                        </div>
                        <span className="text-lg font-bold" style={{ color: item.color }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bar Chart */}
                <div className="mt-6 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="לידים" fill={CHART_COLORS.primary} radius={[8, 8, 0, 0]} />
                      <Bar dataKey="חדשים" fill={CHART_COLORS.secondary} radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Partners Chart */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-card/50">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">לידים לפי שותף</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pie Chart */}
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={partnerData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {partnerData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Stats List */}
                  <div className="space-y-2">
                    {partnerData.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span className="font-medium text-sm">{item.name}</span>
                        </div>
                        <span className="text-lg font-bold" style={{ color: item.color }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Stats */}
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">160</div>
                    <div className="text-xs text-muted-foreground mt-1">סה"כ לידים</div>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">32</div>
                    <div className="text-xs text-muted-foreground mt-1">חדשים</div>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">53</div>
                    <div className="text-xs text-muted-foreground mt-1">ממוצע לשותף</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* My Questionnaires - Part 3 */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">השאלונים שלי</h2>
            
            <div className="space-y-3">
              {questionnaires.map((q, idx) => {
                const gradients = [
                  "from-violet-500/10 to-violet-500/5",
                  "from-blue-500/10 to-blue-500/5",
                  "from-orange-500/10 to-orange-500/5",
                  "from-rose-500/10 to-rose-500/5"
                ];
                const borderColors = [
                  "border-violet-500/30",
                  "border-blue-500/30",
                  "border-orange-500/30",
                  "border-rose-500/30"
                ];
                
                return (
                  <Card 
                    key={q.id} 
                    className={`border ${borderColors[idx % 4]} shadow-md hover:shadow-lg transition-all bg-gradient-to-l ${gradients[idx % 4]} cursor-pointer`}
                    onClick={() => navigate('/content-inspiration')}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Right side - Title and Date */}
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-foreground">{q.title}</h3>
                            <p className="text-sm text-muted-foreground">{q.subtitle}</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{q.date}</span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className="text-xl font-bold text-primary">{q.leads.total}</div>
                            <div className="text-xs text-muted-foreground">לידים</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{q.leads.new}</div>
                            <div className="text-xs text-muted-foreground">חדשים</div>
                          </div>
                        </div>

                        {/* Sources and Partners */}
                        <div className="flex items-center gap-4 text-xs">
                          <div>
                            <span className="font-semibold text-muted-foreground">ערוצים: </span>
                            <span className="text-foreground">{q.sources.length > 0 ? q.sources.length : 0}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-muted-foreground">שותפים: </span>
                            <span className="text-foreground">{q.partners.length > 0 ? q.partners.length : 0}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`/questionnaire-view/${q.id}?mode=form`, '_blank');
                            }}
                          >
                            <Eye className="h-4 w-4 ml-2" />
                            הצגה
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/leads-responses?id=${q.id}&tab=analysis`);
                            }}
                          >
                            <BarChart3 className="h-4 w-4 ml-2" />
                            סטטיסטיקות
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/create-questionnaire?id=${q.id}&mode=edit`);
                            }}
                          >
                            <Edit className="h-4 w-4 ml-2" />
                            עריכה
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/distribution?id=${q.id}`);
                            }}
                          >
                            <Share2 className="h-4 w-4 ml-2" />
                            שיתוף
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default MyHoogi;