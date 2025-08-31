import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Sidebar } from './Sidebar';
import { TooltipWrapper } from './TooltipWrapper';
import { useLanguage } from '../contexts/LanguageContext';
import { routes } from "@/routes";

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Floating create button – top-left, visible on all app screens (desktop) */}
      <div className="hidden lg:block fixed top-6 left-6 z-40">
        <Button
          variant="hoogi"
          className="flex items-center gap-2 shadow-xl"
          onClick={() => navigate('/onboarding')}
        >
          <Plus className="h-4 w-4" />
          {t('dashboard.getStartedBtn')}
        </Button>
      </div>
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur-sm">
        <TooltipWrapper content={t('layout.openMenu')}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </TooltipWrapper>
        <h1 className="font-bold text-lg text-primary">iHoogi</h1>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Main content */}
        <main className="flex-1 lg:ml-0">
          {/* Top action bar */}
          <div className="hidden lg:flex items-center justify-end px-6 pt-6">
            <Button variant="hoogi" className="flex items-center gap-2" onClick={() => navigate('/onboarding')}>
              <Plus className="h-4 w-4" />
              שאלון חדש
            </Button>
          </div>
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};