
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Phone, MessageCircle, Edit, MoreHorizontal, Check, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Mock data for leads with expanded fields to match the example image
const leadsMockData = [
  {
    id: 1,
    avatar: "https://i.pravatar.cc/36?img=3",
    name: "ישראל ישראלי",
    postType: "פוסט",
    leadStatus: "חדש",
    leadStatusColor: "blue",
    email: "israel@example.com",
    phone: "050-1234567",
    autoReply: "אימייל",
    notes: "",
    date: "2023-04-16",
    thumbnail: "https://placehold.co/200"
  },
  {
    id: 2,
    avatar: "https://i.pravatar.cc/36?img=6",
    name: "שרה כהן",
    postType: "טופס",
    leadStatus: "פתוח",
    leadStatusColor: "green",
    email: "sarah@example.com",
    phone: "052-7654321",
    autoReply: "SMS",
    notes: "הוסר מתגובה",
    date: "2023-04-15",
    thumbnail: "https://placehold.co/200"
  },
  {
    id: 3,
    avatar: "https://i.pravatar.cc/36?img=8",
    name: "דוד לוי",
    postType: "סרט",
    leadStatus: "קמפיין",
    leadStatusColor: "purple",
    email: "david@example.com",
    phone: "054-1112233",
    autoReply: "בחר אוטומציה",
    notes: "",
    date: "2023-04-14",
    thumbnail: "https://placehold.co/200"
  },
  {
    id: 4,
    avatar: "https://i.pravatar.cc/36?img=10",
    name: "רחל אברהם",
    postType: "פוסט",
    leadStatus: "חדש",
    leadStatusColor: "blue",
    email: "rachel@example.com",
    phone: "053-3334444",
    autoReply: "וואטסאפ",
    notes: "",
    date: "2023-04-13",
    thumbnail: "https://placehold.co/200"
  }
];

const LeadsTable = () => {
  const navigate = useNavigate();
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  const toggleSelectRow = (id: number) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const handleRowClick = (id: number) => {
    navigate(`/lead-detail?id=${id}`);
  };
  
  const showToast = (message: string) => {
    toast.info(message);
  };

  return (
    <MainLayout initialState="leads">
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h1 className="text-2xl font-bold mb-6 text-right">לידים &amp; תגובות</h1>
        
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[32px]"></TableHead>
              <TableHead>פרטים ותוכן</TableHead>
              <TableHead>פרטי קשר</TableHead>
              <TableHead>אוטומציות</TableHead>
              <TableHead>הערות</TableHead>
              <TableHead className="w-[80px]">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leadsMockData.map((lead) => (
              <TableRow 
                key={lead.id} 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleRowClick(lead.id)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedRows.includes(lead.id)}
                    onCheckedChange={() => toggleSelectRow(lead.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={lead.avatar} alt={lead.name} />
                      <AvatarFallback>{lead.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-semibold">{lead.name}</span>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">{lead.postType}</Badge>
                        <Badge className={`text-xs bg-${lead.leadStatusColor}-500`}>{lead.leadStatus}</Badge>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{lead.date}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1">
                      <a href={`mailto:${lead.email}`} onClick={(e) => e.stopPropagation()} className="text-blue-600 hover:text-blue-800">
                        <Mail className="h-4 w-4 inline mr-1" />
                        <span>{lead.email}</span>
                      </a>
                    </div>
                    <div className="flex items-center gap-1">
                      <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()} className="text-blue-600 hover:text-blue-800">
                        <Phone className="h-4 w-4 inline mr-1" />
                        <span>{lead.phone}</span>
                      </a>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Badge variant={lead.autoReply === "בחר אוטומציה" ? "outline" : "default"} 
                      className="cursor-pointer"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        showToast("בחירת אוטומציה"); 
                      }}
                    >
                      {lead.autoReply}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600">{lead.notes || 'אין הערות'}</span>
                  </div>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()} className="space-x-1 text-right">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={() => showToast("הצג תוכן")}
                    title="הצג תוכן"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={() => showToast("עריכת הערות")}
                    title="ערוך הערות"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={() => showToast("אפשרויות נוספות")}
                    title="אפשרויות נוספות"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </MainLayout>
  );
};

export default LeadsTable;
