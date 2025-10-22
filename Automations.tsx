import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"; 
import MainLayout from "@/components/layout/MainLayout";
import { Bell, Edit, Settings, ArrowRight, AlertTriangle, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import TriggersTab from "@/components/automations/TriggersTab";
import TemplatesTab from "@/components/automations/TemplatesTab";
import PreferencesTab from "@/components/automations/PreferencesTab";
import NotificationsTab from "@/components/automations/NotificationsTab";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

type AutomationTab = "triggers" | "templates" | "prefs" | "notifications";

const Automations = () => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as AutomationTab;
  const [activeTab, setActiveTab] = useState<AutomationTab>(tabParam || "templates");

  useEffect(() => {
    if (tabParam && ["triggers", "templates", "prefs", "notifications"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  return (
    <MainLayout initialState="automations">
      <div className="max-w-4xl mx-auto p-3 md:p-6 lg:p-8" dir="rtl">
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

        <div className="mb-6">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-right">אוטומציות</h1>
          <p className="text-sm md:text-base text-gray-500 text-right">ניהול אוטומציות והתראות</p>
        </div>
        
        <Tabs 
          defaultValue="templates" 
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as AutomationTab)}
          className="w-full"
        >
          <TabsList className="grid grid-cols-4 gap-1 md:gap-2 mb-6 w-full">
            <TabsTrigger 
              value="templates" 
              className={cn("flex items-center gap-1 md:gap-2 text-xs md:text-sm", activeTab === "templates" && "text-green-500")}
            >
              <Edit className="h-3 w-3 md:h-4 md:w-4" />
              <span>תבניות</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="triggers" 
              className={cn("flex items-center gap-1 md:gap-2 text-xs md:text-sm", activeTab === "triggers" && "text-blue-500")}
            >
              <Bell className="h-3 w-3 md:h-4 md:w-4" />
              <span>טריגרים</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="prefs" 
              className={cn("flex items-center gap-1 md:gap-2 text-xs md:text-sm", activeTab === "prefs" && "text-orange-500")}
            >
              <Settings className="h-3 w-3 md:h-4 md:w-4" />
              <span>העדפות</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="notifications" 
              className={cn("flex items-center gap-1 md:gap-2 text-xs md:text-sm", activeTab === "notifications" && "text-red-500")}
            >
              <AlertTriangle className="h-3 w-3 md:h-4 md:w-4" />
              <span>התראות</span>
            </TabsTrigger>
            
          </TabsList>

          <TabsContent value="templates" className="mt-2">
            <TemplatesTab />
          </TabsContent>
          
          <TabsContent value="triggers" className="mt-2">
            <TriggersTab />
          </TabsContent>
          
          <TabsContent value="prefs" className="mt-2">
            <PreferencesTab />
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-2">
            <NotificationsTab />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Automations;
