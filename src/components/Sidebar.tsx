import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList, 
  MessageCircle, 
  Users, 
  Share2, 
  Settings,
  User,
  Menu,
  X,
  FileText
} from 'lucide-react';
import { Button } from './ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { useDemo } from '../contexts/DemoContext';
import { HoogiMascot } from './HoogiMascot';
import { TooltipWrapper } from './TooltipWrapper';
import { Switch } from './ui/switch';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const { t } = useLanguage();
  const { isDemoMode, toggleDemoMode } = useDemo();
  const location = useLocation();

  const navigation = [
    { name: t('nav.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('nav.questionnaires'), href: '/questionnaires', icon: ClipboardList },
    { name: 'סקירת שאלונים', href: '/questionnaire-review', icon: FileText },
    { name: 'תגובות', href: '/responses', icon: MessageCircle },
    { name: t('nav.leads'), href: '/leads', icon: Users },
    { name: 'הפצה', href: '/distribute', icon: Share2 },
    { name: 'פרופיל', href: '/profile', icon: User },
    { name: t('nav.affiliate'), href: '/affiliate', icon: Share2 },
    { name: t('nav.settings'), href: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full w-72 bg-gradient-soft border-r border-border z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <HoogiMascot size="md" />
            <div>
              <h2 className="font-bold text-lg text-primary">iHoogi</h2>
              <p className="text-xs text-muted-foreground">Smart Answer Tool</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Demo Mode Toggle */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('dashboard.demoMode')}</span>
            <TooltipWrapper content={t('sidebar.toggleDemo')}>
              <Switch checked={isDemoMode} onCheckedChange={toggleDemoMode} />
            </TooltipWrapper>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <TooltipWrapper key={item.name} content={`${t('sidebar.navigateTo')} ${item.name}`}>
                <NavLink
                  to={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'text-foreground hover:bg-primary/10 hover:text-primary'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </NavLink>
              </TooltipWrapper>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-primary/5 rounded-lg p-4 text-center">
            <HoogiMascot size="sm" className="mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              {t('sidebar.helpMessage')}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};