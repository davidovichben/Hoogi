
import { useState } from "react";
import { 
  Table, TableHeader, TableRow, TableHead, 
  TableBody, TableCell 
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Mail, Phone, MessageCircle, Edit, 
  Calendar, Search, ArrowUpRight, Trash2, StickyNote, Tag, Download
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Sheet, SheetContent, SheetHeader, 
  SheetTitle, SheetClose, SheetTrigger 
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { mockLeads } from "./data/mockData";
import LeadDetailCard from "./LeadDetailCard";
import QuestionnaireAnswersDialog from "./QuestionnaireAnswersDialog";
import PartnerDetailsDialog from "./PartnerDetailsDialog";

interface LeadsListProps {
  searchQuery: string;
}

const LeadsList = ({ searchQuery }: LeadsListProps) => {
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [selectedLead, setSelectedLead] = useState<number | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [viewedLeads, setViewedLeads] = useState<number[]>([]);
  const [leadStatuses, setLeadStatuses] = useState<Record<number, string>>({});
  const [leadSubStatuses, setLeadSubStatuses] = useState<Record<number, string>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<number | null>(null);
  const [answersDialogOpen, setAnswersDialogOpen] = useState(false);
  const [selectedLeadForAnswers, setSelectedLeadForAnswers] = useState<number | null>(null);
  const [partnerDialogOpen, setPartnerDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<{ 
    name: string; 
    total: number; 
    new: number; 
    commission?: {
      type: "percentage" | "fixed" | "hybrid";
      value: number | { percentage: number; fixed: number };
      frequency: "monthly" | "per_lead" | "quarterly";
      paymentTerms: string;
      additionalInfo?: string;
    };
  } | null>(null);
  
  // Filter states
  const [filterText, setFilterText] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterChannel, setFilterChannel] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterQuestionnaire, setFilterQuestionnaire] = useState("");
  const [filterPartner, setFilterPartner] = useState("");

  const filteredLeads = mockLeads.filter(lead => {
    const matchesText = !filterText || 
      lead.name.includes(filterText) || 
      lead.email.includes(filterText) || 
      lead.phone.includes(filterText);
    const matchesChannel = !filterChannel || lead.source === filterChannel;
    const matchesStatus = !filterStatus || (leadStatuses[lead.id] || lead.status) === filterStatus;
    const matchesQuestionnaire = !filterQuestionnaire; // Add logic when questionnaire data is available
    const matchesPartner = !filterPartner || lead.partner === filterPartner;
    
    return matchesText && matchesChannel && matchesStatus && matchesQuestionnaire && matchesPartner;
  });

  const toggleSelectRow = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === filteredLeads.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredLeads.map(lead => lead.id));
    }
  };

  const handleRowClick = (id: number) => {
    setSelectedLead(id);
    setIsDetailSheetOpen(true);
    if (!viewedLeads.includes(id)) {
      setViewedLeads(prev => [...prev, id]);
    }
  };

  const handleQuestionnaireClick = (id: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedLeadForAnswers(id);
    setAnswersDialogOpen(true);
  };

  const handlePartnerClick = (partnerName: string) => {
    if (!partnerName) return;
    // Calculate partner stats from leads
    const partnerLeads = mockLeads.filter(lead => lead.partner === partnerName);
    const total = partnerLeads.length;
    const newLeads = partnerLeads.filter(lead => lead.status === "new").length;
    
    // Get commission data from first lead with this partner
    const leadWithCommission = partnerLeads.find(lead => lead.commission);
    const commission = leadWithCommission?.commission;
    
    setSelectedPartner({ 
      name: partnerName, 
      total, 
      new: newLeads,
      commission 
    });
    setPartnerDialogOpen(true);
  };

  const handleSaveNote = (id: number, note: string) => {
    setNotes(prev => ({
      ...prev,
      [id]: note
    }));
    toast.success("ההערה נשמרה בהצלחה");
  };

  const handleDeleteLead = () => {
    if (leadToDelete !== null) {
      toast.success(`ליד מספר ${leadToDelete} נמחק בהצלחה`);
      setDeleteDialogOpen(false);
      setLeadToDelete(null);
    }
  };

  const getLeadStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-500 text-white";
      case "in-progress": return "bg-yellow-500 text-white";
      case "reminder": return "bg-purple-500 text-white";
      case "closed-success": return "bg-green-500 text-white";
      case "not-relevant": return "bg-gray-500 text-white";
      default: return "bg-blue-500 text-white";
    }
  };

  const getLeadStatusLabel = (status: string) => {
    switch (status) {
      case "new": return "חדש";
      case "in-progress": return "בטיפול";
      case "reminder": return "תזכורת";
      case "closed-success": return "נסגר בהצלחה";
      case "not-relevant": return "לא רלוונטי";
      case "no-answer": return "לא נענה";
      case "cancelled": return "בוטל ע״י הלקוח";
      default: return status;
    }
  };

  const getSubStatusOptions = (mainStatus: string): string[] => {
    switch (mainStatus) {
      case "in-progress": 
        return ["נוצר קשר", "הצעת מחיר נשלחה", "ממתין למענה", "שיחה מתוכננת"];
      case "reminder": 
        return ["לחזור בעוד שבוע", "ממתין לאישור", "לקוח ביקש להתעדכן"];
      case "closed-success": 
        return ["לקוח פעיל", "שירות סופק", "תשלום הושלם"];
      case "not-relevant": 
        return ["לא מעוניין", "לא מתאים", "ליד כפול", "מידע חסר"];
      case "no-answer": 
        return ["ניסיונות כושלים", "מספר לא תקין"];
      case "cancelled": 
        return ["ביטל אחרי הצעת מחיר", "עבר לספק אחר"];
      default: 
        return [];
    }
  };

  const handleStatusChange = (leadId: number, newStatus: string) => {
    setLeadStatuses(prev => ({
      ...prev,
      [leadId]: newStatus
    }));
    // Reset sub-status when main status changes
    setLeadSubStatuses(prev => ({
      ...prev,
      [leadId]: ""
    }));
    toast.success("הסטטוס עודכן בהצלחה");
  };

  const handleSubStatusChange = (leadId: number, newSubStatus: string) => {
    setLeadSubStatuses(prev => ({
      ...prev,
      [leadId]: newSubStatus
    }));
    toast.success("תת-הסטטוס עודכן בהצלחה");
  };

  const showComingSoon = (feature: string) => {
    toast.info(`${feature} - יתווסף בקרוב`);
  };

  return (
    <div className="w-full">
      {/* Compact Filter Bar - Top Only */}
      <div className="bg-background rounded-lg border p-2 mb-3">
        {/* Mobile - Single row with search, filter and export button */}
        <div className="flex md:hidden gap-2">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חיפוש..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="pr-9 h-9"
              />
            </div>
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1 h-9 shrink-0 px-2">
                <Search className="h-4 w-4" />
                <span className="text-xs">סינון</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <SheetHeader>
                <SheetTitle>סינון מתקדם</SheetTitle>
              </SheetHeader>
              <div className="space-y-3 mt-4">
                <div>
                  <label className="text-xs font-medium mb-1 block">מתאריך</label>
                  <Input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-xs font-medium mb-1 block">עד תאריך</label>
                  <Input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium mb-1 block">ערוץ</label>
                  <Select value={filterChannel} onValueChange={setFilterChannel}>
                    <SelectTrigger>
                      <SelectValue placeholder="כל הערוצים" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">הכל</SelectItem>
                      <SelectItem value="Facebook">Facebook</SelectItem>
                      <SelectItem value="Instagram">Instagram</SelectItem>
                      <SelectItem value="Website">Website</SelectItem>
                      <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium mb-1 block">סטטוס</label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="כל הסטטוסים" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">הכל</SelectItem>
                      <SelectItem value="new">חדש</SelectItem>
                      <SelectItem value="in-progress">בטיפול</SelectItem>
                      <SelectItem value="reminder">תזכורת</SelectItem>
                      <SelectItem value="closed-success">נסגר בהצלחה</SelectItem>
                      <SelectItem value="not-relevant">לא רלוונטי</SelectItem>
                      <SelectItem value="no-answer">לא נענה</SelectItem>
                      <SelectItem value="cancelled">בוטל ע״י הלקוח</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium mb-1 block">שאלון</label>
                  <Select value={filterQuestionnaire} onValueChange={setFilterQuestionnaire}>
                    <SelectTrigger>
                      <SelectValue placeholder="כל השאלונים" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">הכל</SelectItem>
                      <SelectItem value="landing">טופס צור קשר</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium mb-1 block">שותף</label>
                  <Select value={filterPartner} onValueChange={setFilterPartner}>
                    <SelectTrigger>
                      <SelectValue placeholder="כל השותפים" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">הכל</SelectItem>
                      <SelectItem value="">ללא שותף</SelectItem>
                      <SelectItem value="דני כהן">דני כהן</SelectItem>
                      <SelectItem value="יעל לוי">יעל לוי</SelectItem>
                      <SelectItem value="רון אבני">רון אבני</SelectItem>
                      <SelectItem value="מיכל גרין">מיכל גרין</SelectItem>
                      <SelectItem value="אורי שמש">אורי שמש</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setFilterText("");
                    setFilterDateFrom("");
                    setFilterDateTo("");
                    setFilterChannel("");
                    setFilterStatus("");
                    setFilterQuestionnaire("");
                    setFilterPartner("");
                  }}
                >
                  אפס סינונים
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <Button 
            size="sm" 
            onClick={() => {
              // Export to Excel logic
              const csvContent = [
                ['שם', 'אימייל', 'טלפון', 'תאריך', 'סטטוס', 'ערוץ', 'סוג אוטומציה', 'שותף'],
                ...filteredLeads.map(lead => [
                  lead.name,
                  lead.email,
                  lead.phone,
                  lead.date,
                  leadStatuses[lead.id] || lead.status,
                  lead.source,
                  lead.automationType,
                  lead.partner || 'ללא'
                ])
              ].map(row => row.join(',')).join('\n');
              
              const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
              link.click();
              toast.success('הקובץ יוצא בהצלחה!');
            }}
            className="h-9 shrink-0 px-3 bg-green-600 hover:bg-green-700 text-white gap-1"
          >
            <Download className="h-3 w-3" />
            <span className="text-xs font-medium">Excel</span>
          </Button>
        </div>

        {/* Desktop - All filters inline in ONE ROW */}
        <div className="hidden md:flex gap-2 items-center">
          <div className="flex-1 min-w-[180px] max-w-[250px]">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חיפוש..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="pr-9 h-9"
              />
            </div>
          </div>

          <Input
            type="date"
            placeholder="מתאריך"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="w-[130px] h-9"
          />

          <Input
            type="date"
            placeholder="עד תאריך"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="w-[130px] h-9"
          />
          
          <Select value={filterChannel} onValueChange={setFilterChannel}>
            <SelectTrigger className="w-[110px] h-9">
              <SelectValue placeholder="ערוץ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">הכל</SelectItem>
              <SelectItem value="Facebook">Facebook</SelectItem>
              <SelectItem value="Instagram">Instagram</SelectItem>
              <SelectItem value="Website">Website</SelectItem>
              <SelectItem value="WhatsApp">WhatsApp</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[110px] h-9">
              <SelectValue placeholder="סטטוס" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">הכל</SelectItem>
              <SelectItem value="new">חדש</SelectItem>
              <SelectItem value="in-progress">בטיפול</SelectItem>
              <SelectItem value="reminder">תזכורת</SelectItem>
              <SelectItem value="closed-success">נסגר בהצלחה</SelectItem>
              <SelectItem value="not-relevant">לא רלוונטי</SelectItem>
              <SelectItem value="no-answer">לא נענה</SelectItem>
              <SelectItem value="cancelled">בוטל ע״י הלקוח</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterQuestionnaire} onValueChange={setFilterQuestionnaire}>
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue placeholder="שאלון" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">הכל</SelectItem>
              <SelectItem value="landing">טופס צור קשר</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPartner} onValueChange={setFilterPartner}>
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue placeholder="שותף" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">הכל</SelectItem>
              <SelectItem value="דני כהן">דני כהן</SelectItem>
              <SelectItem value="יעל לוי">יעל לוי</SelectItem>
              <SelectItem value="רון אבני">רון אבני</SelectItem>
              <SelectItem value="מיכל גרין">מיכל גרין</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            size="sm"
            className="h-9 shrink-0"
            onClick={() => {
              setFilterText("");
              setFilterDateFrom("");
              setFilterDateTo("");
              setFilterChannel("");
              setFilterStatus("");
              setFilterQuestionnaire("");
              setFilterPartner("");
            }}
          >
            אפס
          </Button>

          <Button 
            size="sm"
            className="h-9 shrink-0 gap-2 bg-green-600 hover:bg-green-700 text-white"
            onClick={() => {
              // Export to Excel logic
              const csvContent = [
                ['שם', 'אימייל', 'טלפון', 'תאריך', 'סטטוס', 'ערוץ', 'סוג אוטומציה', 'שותף'],
                ...filteredLeads.map(lead => [
                  lead.name,
                  lead.email,
                  lead.phone,
                  lead.date,
                  leadStatuses[lead.id] || lead.status,
                  lead.source,
                  lead.automationType,
                  lead.partner || 'ללא'
                ])
              ].map(row => row.join(',')).join('\n');
              
              const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
              link.click();
              toast.success('הקובץ יוצא בהצלחה!');
            }}
          >
            <Download className="h-4 w-4" />
            ייצוא Excel
          </Button>
        </div>
      </div>

      {selectedRows.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-medium">{selectedRows.length} נבחרו</span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => showComingSoon("פעולות קבוצתיות")}
          >
            פעולות קבוצתיות
          </Button>
        </div>
      )}
      
      {filteredLeads.length > 0 ? (
        <>
          {/* Mobile Card View - Compact */}
          <div className="block md:hidden space-y-2.5">
            {filteredLeads.map((lead) => {
              const isNew = lead.status === "new" && !viewedLeads.includes(lead.id);
              const currentStatus = leadStatuses[lead.id] || lead.status;
              const currentSubStatus = leadSubStatuses[lead.id] || "";
              
              return (
                <div 
                  key={lead.id}
                  className={`bg-white rounded-lg border ${isNew ? 'border-blue-500 border-2' : 'border-border'} p-2.5 space-y-2 shadow-sm`}
                >
                  {/* Row 1: Name + Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Checkbox 
                        checked={selectedRows.includes(lead.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedRows([...selectedRows, lead.id]);
                          } else {
                            setSelectedRows(selectedRows.filter(id => id !== lead.id));
                          }
                        }}
                        className="mt-0.5"
                      />
                      <div className="font-semibold text-sm truncate">{lead.name}</div>
                    </div>
                    <Badge 
                      className={`${getLeadStatusColor(currentStatus)} text-[10px] font-medium px-1.5 py-0.5 shrink-0`}
                    >
                      {getLeadStatusLabel(currentStatus)}
                    </Badge>
                  </div>

                  {/* Row 2: Channel + Questionnaire + View Answers */}
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-purple-50 border-purple-200 text-purple-700">
                      {lead.source}
                    </Badge>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground truncate">טופס צור קשר</span>
                    <span className="text-muted-foreground">•</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuestionnaireClick(lead.id, e);
                      }}
                      className="text-primary hover:underline text-[10px] flex items-center gap-0.5"
                    >
                      צפה תשובות
                      <ArrowUpRight className="h-2.5 w-2.5" />
                    </button>
                  </div>

                  {/* Row 3: Status selectors in same row */}
                  <div className="grid grid-cols-2 gap-2">
                    <Select 
                      value={currentStatus}
                      onValueChange={(value) => handleStatusChange(lead.id, value)}
                    >
                      <SelectTrigger className="w-full h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">חדש</SelectItem>
                        <SelectItem value="in-progress">בטיפול</SelectItem>
                        <SelectItem value="reminder">תזכורת</SelectItem>
                        <SelectItem value="closed-success">נסגר בהצלחה</SelectItem>
                        <SelectItem value="not-relevant">לא רלוונטי</SelectItem>
                        <SelectItem value="no-answer">לא נענה</SelectItem>
                        <SelectItem value="cancelled">בוטל ע״י הלקוח</SelectItem>
                      </SelectContent>
                    </Select>

                    {getSubStatusOptions(currentStatus).length > 0 && (
                      <Select 
                        value={currentSubStatus}
                        onValueChange={(value) => handleSubStatusChange(lead.id, value)}
                      >
                        <SelectTrigger className="w-full h-8 text-xs">
                          <SelectValue placeholder="תת-סטטוס" />
                        </SelectTrigger>
                        <SelectContent>
                          {getSubStatusOptions(currentStatus).map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Row 4: Quick Actions - All 4 in same row */}
                  <div className="grid grid-cols-4 gap-1">
                    <a
                      href={`tel:${lead.phone}`}
                      className="flex flex-col items-center justify-center gap-0.5 p-1 rounded-md bg-green-50 border border-green-200 hover:bg-green-100 transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href = `tel:${lead.phone}`;
                        toast.success("פותח שיחה...");
                      }}
                    >
                      <Phone className="h-3 w-3 text-green-600" />
                      <span className="text-[8px] font-medium text-green-700">שיחה</span>
                    </a>

                    <a
                      href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center gap-0.5 p-1 rounded-md bg-green-50 border border-green-200 hover:bg-green-100 transition-colors"
                      onClick={() => toast.success("פותח WhatsApp...")}
                    >
                      <MessageCircle className="h-3 w-3 text-green-600" />
                      <span className="text-[8px] font-medium text-green-700">וואטס</span>
                    </a>

                    <a
                      href={`sms:${lead.phone}`}
                      className="flex flex-col items-center justify-center gap-0.5 p-1 rounded-md bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
                      onClick={() => toast.success("פותח הודעות...")}
                    >
                      <MessageCircle className="h-3 w-3 text-blue-600" />
                      <span className="text-[8px] font-medium text-blue-700">הודעה</span>
                    </a>
                    
                    <a
                      href={`mailto:${lead.email}`}
                      className="flex flex-col items-center justify-center gap-0.5 p-1 rounded-md bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-colors"
                      onClick={() => toast.success("פותח מייל...")}
                    >
                      <Mail className="h-3 w-3 text-purple-600" />
                      <span className="text-[8px] font-medium text-purple-700">מייל</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View - Compact */}
          <div className="hidden md:block rounded-md border overflow-x-auto">
            <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px] p-2">
                  <Checkbox 
                    checked={selectedRows.length === filteredLeads.length && filteredLeads.length > 0} 
                    onCheckedChange={toggleSelectAll}
                    aria-label="בחר הכל"
                  />
                </TableHead>
                <TableHead className="w-[180px] p-2">שם לקוח</TableHead>
                <TableHead className="w-[140px] p-2">שאלון</TableHead>
                <TableHead className="w-[100px] p-2">שותף</TableHead>
                <TableHead className="w-[80px] p-2">ערוץ</TableHead>
                <TableHead className="w-[120px] p-2">סטטוס</TableHead>
                <TableHead className="w-[120px] p-2">תת-סטטוס</TableHead>
                <TableHead className="w-[100px] p-2">אוטומציות</TableHead>
                <TableHead className="w-[160px] p-2">פעולות מהירות</TableHead>
                <TableHead className="w-[70px] p-2 text-center">הערות</TableHead>
                <TableHead className="w-[60px] p-2 text-center">מחק</TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {filteredLeads.map((lead) => {
                const isNew = lead.status === "new" && !viewedLeads.includes(lead.id);
                const currentStatus = leadStatuses[lead.id] || lead.status;
                const currentSubStatus = leadSubStatuses[lead.id] || "";
                
                return (
                  <TableRow 
                    key={lead.id} 
                    className={`${selectedRows.includes(lead.id) ? "bg-primary/5" : ""} ${isNew ? "border-r-4 border-r-blue-500" : ""}`}
                  >
                    <TableCell className="p-2" onClick={(e) => toggleSelectRow(lead.id, e)}>
                      <Checkbox 
                        checked={selectedRows.includes(lead.id)} 
                        aria-label={`בחר ליד ${lead.name}`}
                      />
                    </TableCell>
                    
                    <TableCell className="p-2">
                      <div className="flex flex-col gap-0.5">
                        <div className="font-medium text-sm">{lead.name}</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {lead.date}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="p-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuestionnaireClick(lead.id, e);
                        }}
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        טופס צור קשר
                        <ArrowUpRight className="h-3 w-3" />
                      </button>
                    </TableCell>

                    <TableCell className="p-2">
                      {lead.partner ? (
                        <button
                          onClick={() => handlePartnerClick(lead.partner)}
                          className="text-sm text-primary hover:underline font-medium"
                        >
                          {lead.partner}
                        </button>
                      ) : (
                        <span className="text-sm text-muted-foreground">ללא</span>
                      )}
                    </TableCell>
                    
                    <TableCell className="p-2">
                      <Badge variant="outline" className="text-xs bg-purple-50 border-purple-200 text-purple-700">
                        {lead.source}
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="p-2" onClick={(e) => e.stopPropagation()}>
                      <Select 
                        value={currentStatus}
                        onValueChange={(value) => handleStatusChange(lead.id, value)}
                      >
                        <SelectTrigger className="w-full h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">חדש</SelectItem>
                          <SelectItem value="in-progress">בטיפול</SelectItem>
                          <SelectItem value="reminder">תזכורת</SelectItem>
                          <SelectItem value="closed-success">נסגר בהצלחה</SelectItem>
                          <SelectItem value="not-relevant">לא רלוונטי</SelectItem>
                          <SelectItem value="no-answer">לא נענה</SelectItem>
                          <SelectItem value="cancelled">בוטל ע״י הלקוח</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    
                    <TableCell className="p-2" onClick={(e) => e.stopPropagation()}>
                      {getSubStatusOptions(currentStatus).length > 0 ? (
                        <Select 
                          value={currentSubStatus}
                          onValueChange={(value) => handleSubStatusChange(lead.id, value)}
                        >
                          <SelectTrigger className="w-full h-8 text-xs">
                            <SelectValue placeholder="תת-סטטוס" />
                          </SelectTrigger>
                          <SelectContent>
                            {getSubStatusOptions(currentStatus).map((subStatus) => (
                              <SelectItem key={subStatus} value={subStatus}>{subStatus}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    
                    <TableCell className="p-2" onClick={(e) => e.stopPropagation()}>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge 
                              variant="outline" 
                              className={`text-xs cursor-help ${
                                lead.automationType === "AI" 
                                  ? "bg-blue-50 border-blue-200 text-blue-700" 
                                  : lead.automationType === "AI משולב אישי"
                                  ? "bg-purple-50 border-purple-200 text-purple-700"
                                  : lead.automationType === "משוב אישי"
                                  ? "bg-green-50 border-green-200 text-green-700"
                                  : lead.automationType === "סטנדרט"
                                  ? "bg-gray-50 border-gray-200 text-gray-700"
                                  : "bg-orange-50 border-orange-200 text-orange-700"
                              }`}
                            >
                              {lead.automationType}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-xs" dir="rtl">
                            <div className="space-y-2 text-sm">
                              <div className="font-semibold border-b pb-1">{lead.templateName || "ללא תבנית"}</div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">סוג אוטומציה:</span>
                                  <Badge variant="outline" className="text-xs">
                                    {lead.automationType}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">מענה:</span>
                                  <span className="font-medium">
                                    {currentStatus === "reminder" ? "תזכורת" : "שאלון"}
                                  </span>
                                </div>
                                {currentStatus === "reminder" && (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground">סטטוס:</span>
                                      <Badge variant="secondary" className="text-xs">
                                        {getLeadStatusLabel(currentStatus)}
                                      </Badge>
                                    </div>
                                    {currentSubStatus && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">תת-סטטוס:</span>
                                        <Badge variant="secondary" className="text-xs">
                                          {currentSubStatus}
                                        </Badge>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    
                    <TableCell className="p-2">
                      <div className="flex items-center gap-1">
                        <a 
                          href={`tel:${lead.phone}`} 
                          onClick={(e) => e.stopPropagation()} 
                          className="flex items-center justify-center h-7 w-7 rounded bg-green-50 border border-green-200 hover:bg-green-100"
                          title="שיחה"
                        >
                          <Phone className="h-3 w-3 text-green-600" />
                        </a>
                        <a 
                          href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`} 
                          onClick={(e) => e.stopPropagation()} 
                          className="flex items-center justify-center h-7 w-7 rounded bg-green-50 border border-green-200 hover:bg-green-100"
                          target="_blank"
                          rel="noopener noreferrer"
                          title="WhatsApp"
                        >
                          <MessageCircle className="h-3 w-3 text-green-600" />
                        </a>
                        <a 
                          href={`sms:${lead.phone}`}
                          onClick={(e) => e.stopPropagation()} 
                          className="flex items-center justify-center h-7 w-7 rounded bg-blue-50 border border-blue-200 hover:bg-blue-100"
                          title="הודעה"
                        >
                          <MessageCircle className="h-3 w-3 text-blue-600" />
                        </a>
                        <a 
                          href={`mailto:${lead.email}`} 
                          onClick={(e) => e.stopPropagation()} 
                          className="flex items-center justify-center h-7 w-7 rounded bg-purple-50 border border-purple-200 hover:bg-purple-100"
                          title="מייל"
                        >
                          <Mail className="h-3 w-3 text-purple-600" />
                        </a>
                      </div>
                    </TableCell>
                    
                    <TableCell className="p-2" onClick={(e) => e.stopPropagation()}>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-7 w-7 p-0"
                            title="הערות"
                          >
                            <StickyNote className="h-3.5 w-3.5" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="start">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">הערות</h4>
                            <Textarea
                              value={notes[lead.id] || ""}
                              onChange={(e) => setNotes(prev => ({ ...prev, [lead.id]: e.target.value }))}
                              placeholder="כתוב הערה..."
                              className="min-h-[100px]"
                            />
                            <Button 
                              size="sm" 
                              className="w-full"
                              onClick={() => handleSaveNote(lead.id, notes[lead.id] || "")}
                            >
                              שמור
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    
                    <TableCell className="p-2" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" 
                        title="מחק"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLeadToDelete(lead.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        </>
      ) : (
        <div className="border rounded-md p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <MessageCircle className="h-12 w-12 text-muted-foreground/30" />
            <h3 className="text-xl font-medium">אין לידים להצגה</h3>
            <p className="text-muted-foreground">לא נמצאו לידים התואמים לפילטרים שנבחרו</p>
          </div>
        </div>
      )}

      <Sheet 
        open={isDetailSheetOpen} 
        onOpenChange={setIsDetailSheetOpen}
      >
        <SheetContent className="w-full sm:max-w-[90%] md:max-w-[80%] overflow-y-auto p-0" side="right">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex justify-between items-center">
              <div className="flex items-center">
                <SheetClose asChild>
                  <Button variant="ghost" size="sm" className="mr-2">
                    <ArrowUpRight className="h-4 w-4 rotate-180" />
                    <span className="mr-1">חזרה לרשימה</span>
                  </Button>
                </SheetClose>
              </div>
              <div className="flex items-center gap-2">
                {selectedLead && (
                  <span className="text-lg font-medium">
                    {mockLeads.find(l => l.id === selectedLead)?.name}
                  </span>
                )}
              </div>
            </SheetTitle>
          </SheetHeader>
          
          {selectedLead && (
            <LeadDetailCard 
              leadId={selectedLead} 
              onClose={() => setIsDetailSheetOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת ליד</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את הליד? פעולה זו לא ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLead} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedLeadForAnswers && (
        <QuestionnaireAnswersDialog
          open={answersDialogOpen}
          onOpenChange={setAnswersDialogOpen}
          leadName={mockLeads.find(l => l.id === selectedLeadForAnswers)?.name || ""}
          questionnaireName={mockLeads.find(l => l.id === selectedLeadForAnswers)?.questionnaire || ""}
          answers={mockLeads.find(l => l.id === selectedLeadForAnswers)?.questionnaireAnswers || {}}
        />
      )}

      <PartnerDetailsDialog
        partner={selectedPartner}
        open={partnerDialogOpen}
        onOpenChange={setPartnerDialogOpen}
      />
    </div>
  );
};

export default LeadsList;
