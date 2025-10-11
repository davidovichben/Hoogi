
import MainLayout from "@/components/layout/MainLayout";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Calendar, MessageSquare, Users, BarChart3, Edit, Copy, Share2, FileInput, QrCode, Facebook, MessagesSquare, ExternalLink, Instagram, Linkedin, Globe, Mail, Bot, Link as LinkIcon, MessageCircle, Eye, ChevronDown, ArrowRight, Menu, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import questionnairesIcon from "@/assets/questionnaires-icon-new.png";

interface Questionnaire {
  id: number;
  title: string;
  status: "active" | "draft";
  createdAt: string;
  updatedAt: string;
  responses: {
    total: number;
    answers: number;
    cancellations: number;
  };
  leads: {
    total: number;
    new: number;
    cancellations: number;
  };
  sources: {
    name: string;
    total: number;
    new: number;
  }[];
  automations: {
    type: string;
    method: string;
  }[];
  partners: {
    name: string;
    total: number;
    new: number;
  }[];
}

const ContentInspiration = () => {
  // State for questionnaire view mode (form or chat)
  const [questionnaireViewMode, setQuestionnaireViewMode] = useState<{[key: string]: 'form' | 'chat'}>({});
  
  const [openToolbarId, setOpenToolbarId] = useState<number | null>(null);
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([
    {
      id: 1,
      title: "שאלון שירותי ייעוץ עסקי",
      status: "active",
      createdAt: "3.10.2025",
      updatedAt: "3.10.2025",
      responses: { total: 45, answers: 38, cancellations: 7 },
      leads: { total: 32, new: 12, cancellations: 3 },
      sources: [
        { name: "פייסבוק", total: 15, new: 5 },
        { name: "אינסטגרם", total: 12, new: 4 },
        { name: "לינקדאין", total: 8, new: 2 },
        { name: "אתר", total: 6, new: 1 },
        { name: "ווטסאפ", total: 4, new: 0 }
      ],
      automations: [
        { type: "מייל AI", method: "תשובה אוטומטית" },
        { type: "ווטסאפ", method: "תבנית מותאמת" }
      ],
      partners: [
        { name: "דני כהן", total: 15, new: 6 },
        { name: "יעל לוי", total: 10, new: 4 },
        { name: "רון אבני", total: 7, new: 2 }
      ]
    },
    {
      id: 2,
      title: "שאלון מוצרים דיגיטליים",
      status: "active",
      createdAt: "1.10.2025",
      updatedAt: "2.10.2025",
      responses: { total: 28, answers: 24, cancellations: 4 },
      leads: { total: 18, new: 6, cancellations: 2 },
      sources: [
        { name: "דף נחיתה", total: 10, new: 3 },
        { name: "אתר", total: 9, new: 2 },
        { name: "פייסבוק", total: 9, new: 1 }
      ],
      automations: [
        { type: "ווטסאפ", method: "תשובת AI" }
      ],
      partners: [
        { name: "מיכל גרין", total: 12, new: 4 },
        { name: "אורי שמש", total: 6, new: 2 }
      ]
    },
    {
      id: 3,
      title: "שאלון אירועים",
      status: "draft",
      createdAt: "2.10.2025",
      updatedAt: "2.10.2025",
      responses: { total: 0, answers: 0, cancellations: 0 },
      leads: { total: 0, new: 0, cancellations: 0 },
      sources: [],
      automations: [],
      partners: []
    }
  ]);

  const toggleActive = (id: number) => {
    setQuestionnaires(prev => prev.map(q => q.id === id ? { ...q, status: q.status === "active" ? "draft" : "active" } : q));
  };

  const getCardBackgroundColor = (index: number) => {
    const colors = [
      'bg-blue-50/30 border-blue-200/50',
      'bg-green-50/30 border-green-200/50', 
      'bg-purple-50/30 border-purple-200/50',
      'bg-orange-50/30 border-orange-200/50',
      'bg-pink-50/30 border-pink-200/50',
      'bg-cyan-50/30 border-cyan-200/50'
    ];
    return colors[index % colors.length];
  };
  const getSourceIcon = (sourceName: string) => {
    switch (sourceName) {
      case "פייסבוק": return <Facebook className="h-4 w-4 text-blue-600" />;
      case "אינסטגרם": return <Instagram className="h-4 w-4 text-pink-600" />;
      case "לינקדאין": return <Linkedin className="h-4 w-4 text-blue-700" />;
      case "דף נחיתה": return <FileInput className="h-4 w-4 text-purple-600" />;
      case "ווטסאפ": return <MessagesSquare className="h-4 w-4 text-green-600" />;
      case "אתר": return <Globe className="h-4 w-4 text-gray-600" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const handleCopyLink = (type: string, questionnaireId: number) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/questionnaire/${questionnaireId}/${type}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "הקישור הועתק",
      description: `הקישור ל${type} הועתק ללוח`,
    });
  };

  const handleView = (type: string, questionnaireId: number) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/questionnaire/${questionnaireId}/${type}`;
    window.open(link, '_blank');
  };

  const toggleQuestionnaireView = (id: number) => {
    setQuestionnaireViewMode(prev => ({
      ...prev,
      [id.toString()]: prev[id.toString()] === 'form' ? 'chat' : 'form'
    }));
  };

  const getViewMode = (id: number) => questionnaireViewMode[id.toString()] || 'form';

  const handleDuplicateQuestionnaire = (questionnaire: Questionnaire) => {
    const newTitle = prompt(`הכנס כותרת חדשה לשאלון המשוכפל:\n(השאלון המקורי: "${questionnaire.title}")`, `${questionnaire.title} - עותק`);
    
    if (newTitle && newTitle.trim()) {
      const duplicatedQuestionnaire = {
        ...questionnaire,
        id: Date.now(), // Generate new ID
        title: newTitle.trim(),
        createdAt: new Date().toLocaleDateString('he-IL'),
        leads: { total: 0, new: 0 },
        responses: { total: 0 },
        sources: [],
        partners: [],
        automations: []
      };
      
      setQuestionnaires(prev => [duplicatedQuestionnaire, ...prev]);
      toast({
        title: "השאלון שוכפל בהצלחה!",
        description: `השאלון "${newTitle.trim()}" נוסף לרשימה.`,
      });
    }
  };

  return (
    <MainLayout initialState="articles">
      <div className="container mx-auto p-4 max-w-6xl" dir="rtl">
        {/* Back Button */}
        <div className="flex items-center mb-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.history.back()}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowRight className="ml-2 h-4 w-4" />
            חזור
          </Button>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mb-6 flex items-center justify-end">
          <img src={questionnairesIcon} alt="שאלונים" className="h-7 w-7 md:h-8 md:w-8 ml-3" />
          השאלונים שלי
        </h1>
        
        <div className="space-y-4">
          {questionnaires.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>אין שאלונים עדיין</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {questionnaires.map((q, index) => {
                const bgColors = [
                  'bg-blue-50/40 border-blue-200/50',
                  'bg-green-50/40 border-green-200/50',
                  'bg-purple-50/40 border-purple-200/50',
                  'bg-orange-50/40 border-orange-200/50',
                  'bg-pink-50/40 border-pink-200/50',
                  'bg-cyan-50/40 border-cyan-200/50',
                  'bg-indigo-50/40 border-indigo-200/50',
                  'bg-emerald-50/40 border-emerald-200/50',
                ];
                // לוודא שכל שאלון מקבל צבע שונה
                const bgColor = bgColors[index % bgColors.length];
                
                return (
                <Card key={q.id} className={`border shadow-sm hover:shadow-md transition-shadow ${bgColor}`}>
                  <CardContent className="p-4 md:p-6">
                    
                    {/* חלק ראשון: כותרת השאלון - מותאם לנייד */}
                    <div className="mb-6">
                      {/* Mobile Layout */}
                      <div className="block md:hidden">
                        <div className="flex items-center justify-between mb-3">
                          <button 
                            onClick={() => toggleActive(q.id)}
                            className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity ${q.status === 'active' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                          >
                          {q.status === 'active' ? 'פעיל' : 'כבוי'}
                          </button>
                          <div className="flex gap-3">
                            <div className="text-center cursor-pointer" onClick={() => window.open(`/leads-responses?id=${q.id}&tab=leads&filter=all`, '_blank')}>
                              <div className="text-lg font-bold text-primary">{q.leads.total}</div>
                              <div className="text-xs text-muted-foreground">סה"כ</div>
                            </div>
                            <div className="text-center cursor-pointer" onClick={() => window.open(`/leads-responses?id=${q.id}&tab=leads&filter=new`, '_blank')}>
                              <div className="text-lg font-bold text-green-600">{q.leads.new}</div>
                              <div className="text-xs text-muted-foreground">חדשים</div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <h3 className="font-semibold text-base text-foreground mb-1">{q.title}</h3>
                          <p className="text-sm text-muted-foreground">נוצר ב-{q.createdAt}</p>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden md:flex items-center justify-between gap-4">
                        <button 
                          onClick={() => toggleActive(q.id)}
                          className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity ${q.status === 'active' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                        >
                          {q.status === 'active' ? 'פעיל' : 'כבוי'}
                        </button>
                        
                        <div className="text-right flex-1">
                          <h3 className="font-semibold text-lg text-foreground mb-1">{q.title}</h3>
                          <p className="text-sm text-muted-foreground">נוצר ב-{q.createdAt}</p>
                        </div>
                        
                        <div className="flex gap-4">
                          <div className="text-center cursor-pointer" onClick={() => window.open(`/leads-responses?id=${q.id}&tab=leads&filter=all`, '_blank')}>
                            <div className="text-2xl font-bold text-primary">{q.leads.total}</div>
                            <div className="text-xs text-muted-foreground">סה"כ</div>
                          </div>
                          <div className="text-center cursor-pointer" onClick={() => window.open(`/leads-responses?id=${q.id}&tab=leads&filter=new`, '_blank')}>
                            <div className="text-2xl font-bold text-green-600">{q.leads.new}</div>
                            <div className="text-xs text-muted-foreground">חדשים</div>
                        </div>
                        </div>
                      </div>
                    </div>

                    {/* חלק שני: כלי הפעולה - מותאם לנייד */}
                    <div className="mb-4 sm:mb-6">
                      {/* נייד - כפתור המבורגר */}
                      <div className="block sm:hidden">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full flex items-center justify-center gap-2"
                          onClick={() => setOpenToolbarId(openToolbarId === q.id ? null : q.id)}
                        >
                          {openToolbarId === q.id ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                          <span>כלי פעולה</span>
                        </Button>
                        
                        {/* תפריט נפתח בנייד */}
                        {openToolbarId === q.id && (
                          <div className="mt-2 grid grid-cols-2 gap-2 p-3 bg-muted/30 rounded-lg">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="flex-col h-auto py-2 px-2 gap-1 hover:bg-primary/10 transition-colors"
                              onClick={() => {
                                window.open(`/questionnaire-view/${q.id}?mode=form`, '_blank');
                                setOpenToolbarId(null);
                              }}
                            >
                              <Eye className="h-4 w-4 text-primary" />
                              <span className="text-xs font-medium">הצגה</span>
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="flex-col h-auto py-2 px-2 gap-1 hover:bg-primary/10 transition-colors"
                              onClick={() => {
                                window.open(`/distribution?id=${q.id}`, '_blank');
                                setOpenToolbarId(null);
                              }}
                            >
                              <Share2 className="h-4 w-4 text-primary" />
                              <span className="text-xs font-medium">הפצה</span>
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="flex-col h-auto py-2 px-2 gap-1 hover:bg-muted transition-colors"
                              onClick={() => {
                                window.open(`/create-questionnaire?id=${q.id}&mode=edit`, '_blank');
                                setOpenToolbarId(null);
                              }}
                            >
                              <Edit className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs font-medium">עריכה</span>
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="flex-col h-auto py-2 px-2 gap-1 hover:bg-muted transition-colors"
                              onClick={() => {
                                handleDuplicateQuestionnaire(q);
                                setOpenToolbarId(null);
                              }}
                            >
                              <Copy className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs font-medium">שכפול</span>
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="flex-col h-auto py-2 px-2 gap-1 hover:bg-primary/10 transition-colors col-span-2"
                              onClick={() => {
                                window.open(`/leads-responses?id=${q.id}&tab=analysis`, '_blank');
                                setOpenToolbarId(null);
                              }}
                            >
                              <BarChart3 className="h-4 w-4 text-primary" />
                              <span className="text-xs font-medium">נתונים</span>
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {/* דסקטופ - רשת רגילה */}
                      <div className="hidden sm:grid grid-cols-5 gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="flex-col h-auto py-3 px-2 gap-1.5 hover:bg-primary/10 transition-colors"
                          title="הצג שאלון"
                          onClick={() => window.open(`/questionnaire-view/${q.id}?mode=form`, '_blank')}
                        >
                          <Eye className="h-5 w-5 text-primary" />
                          <span className="text-xs font-medium">הצגה</span>
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="flex-col h-auto py-3 px-2 gap-1.5 hover:bg-primary/10 transition-colors"
                          title="הפצה"
                          onClick={() => window.open(`/distribution?id=${q.id}`, '_blank')}
                        >
                          <Share2 className="h-5 w-5 text-primary" />
                          <span className="text-xs font-medium">הפצה</span>
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="flex-col h-auto py-3 px-2 gap-1.5 hover:bg-muted transition-colors"
                          title="עריכה"
                          onClick={() => window.open(`/create-questionnaire?id=${q.id}&mode=edit`, '_blank')}
                        >
                          <Edit className="h-5 w-5 text-muted-foreground" />
                          <span className="text-xs font-medium">עריכה</span>
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="flex-col h-auto py-3 px-2 gap-1.5 hover:bg-muted transition-colors"
                          title="שכפול"
                          onClick={() => handleDuplicateQuestionnaire(q)}
                        >
                          <Copy className="h-5 w-5 text-muted-foreground" />
                          <span className="text-xs font-medium">שכפול</span>
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="flex-col h-auto py-3 px-2 gap-1.5 hover:bg-primary/10 transition-colors"
                          title="נתונים"
                          onClick={() => window.open(`/leads-responses?id=${q.id}&tab=analysis`, '_blank')}
                        >
                          <BarChart3 className="h-5 w-5 text-primary" />
                          <span className="text-xs font-medium">נתונים</span>
                        </Button>
                      </div>
                    </div>

                    {/* חלק שלישי: נתונים - מקורות לידים ושותפים - מותאם לנייד */}
                    <div className="pt-3 sm:pt-4 border-t">
                      <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-3">
                        {/* מקורות לידים */}
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-primary" />
                              <h4 className="font-semibold text-sm">מקורות לידים</h4>
                            </div>
                            <div className="flex gap-2 text-xs">
                              <span 
                                className="cursor-pointer text-primary hover:underline"
                                onClick={() => window.open(`/leads-responses?id=${q.id}&tab=leads&filter=source&source=all`, '_blank')}
                              >
                                {q.sources.reduce((sum, source) => sum + (source.total || 0), 0)} סה"כ
                              </span>
                              <span className="text-muted-foreground">/</span>
                              <span 
                                className="cursor-pointer text-green-600 hover:underline"
                                onClick={() => window.open(`/leads-responses?id=${q.id}&tab=leads&filter=source&source=new`, '_blank')}
                              >
                                {q.sources.reduce((sum, source) => sum + (source.new || 0), 0)} חדשים
                              </span>
                        </div>
                      </div>
                        <div className="flex flex-wrap gap-1.5">
                            {q.sources.length > 0 ? (
                              q.sources.map((source, index) => {
                                // לוגו מייצג לרשתות חברתיות
                                const getSourceIcon = (sourceName: string) => {
                                  switch (sourceName.toLowerCase()) {
                                    case 'פייסבוק':
                                    case 'facebook':
                                      return <Facebook className="h-3 w-3 text-blue-600" />;
                                    case 'אינסטגרם':
                                    case 'instagram':
                                      return <Instagram className="h-3 w-3 text-pink-600" />;
                                    case 'לינקדאין':
                                    case 'linkedin':
                                      return <Linkedin className="h-3 w-3 text-blue-700" />;
                                    case 'ווטסאפ':
                                    case 'whatsapp':
                                      return <MessagesSquare className="h-3 w-3 text-green-600" />;
                                    case 'אתר':
                                    case 'website':
                                      return <Globe className="h-3 w-3 text-purple-600" />;
                                    case 'טיקטוק':
                                    case 'tiktok':
                                      return <MessageCircle className="h-3 w-3 text-black" />;
                                    case 'טוויטר':
                                    case 'twitter':
                                      return <MessageCircle className="h-3 w-3 text-sky-600" />;
                                    default:
                                      return <FileText className="h-3 w-3 text-gray-600" />;
                                  }
                                };

                                return (
                                  <div 
                                    key={index} 
                                    className="bg-gray-100 text-gray-800 border border-gray-200 px-2 py-1.5 rounded text-xs flex items-center gap-1.5 cursor-pointer hover:bg-gray-200 transition-colors min-w-0 flex-shrink-0"
                                    onClick={() => window.open(`/leads-responses?id=${q.id}&tab=leads&filter=source&source=${encodeURIComponent(source.name)}`, '_blank')}
                                  >
                                    {getSourceIcon(source.name)}
                                    <span className="truncate">{source.name}</span>
                                    <span className="text-xs opacity-75 flex-shrink-0">
                                      ({source.total || 0} / {source.new || 0})
                              </span>
                                  </div>
                                );
                              })
                          ) : (
                              <span className="text-muted-foreground text-xs">אין מקורות</span>
                          )}
                        </div>
                      </div>

                        {/* שותפים */}
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-primary" />
                              <h4 className="font-semibold text-sm">שותפים</h4>
                            </div>
                            <div className="flex gap-2 text-xs">
                              <span 
                                className="cursor-pointer text-primary hover:underline"
                                onClick={() => window.open(`/leads-responses?id=${q.id}&tab=leads&filter=partner&partner=all`, '_blank')}
                              >
                                {q.partners.reduce((sum, partner) => sum + (partner.total || 0), 0)} סה"כ
                              </span>
                              <span className="text-muted-foreground">/</span>
                              <span 
                                className="cursor-pointer text-green-600 hover:underline"
                                onClick={() => window.open(`/leads-responses?id=${q.id}&tab=leads&filter=partner&partner=new`, '_blank')}
                              >
                                {q.partners.reduce((sum, partner) => sum + (partner.new || 0), 0)} חדשים
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {q.partners.length > 0 ? (
                              q.partners.map((partner, index) => (
                                <div 
                                  key={index} 
                                  className="bg-slate-100 text-slate-800 border border-slate-200 px-2 py-1.5 rounded text-xs flex items-center gap-1.5 cursor-pointer hover:bg-slate-200 transition-colors min-w-0 flex-shrink-0"
                                  onClick={() => window.open(`/leads-responses?id=${q.id}&tab=leads&filter=partner&partner=${encodeURIComponent(partner.name)}`, '_blank')}
                                >
                                  <span className="truncate">{partner.name}</span>
                                  <span className="text-xs opacity-75 flex-shrink-0">
                                    ({partner.total || 0} / {partner.new || 0})
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-xs">אין שותפים</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
              })}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ContentInspiration;
