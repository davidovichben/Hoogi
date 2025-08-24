import React, { useState } from 'react';
import { Share2, Copy, Users, DollarSign, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { HoogiMessage } from '../components/HoogiMascot';
import { TooltipWrapper } from '../components/TooltipWrapper';
import { useLanguage } from '../contexts/LanguageContext';
import { useDemo } from '../contexts/DemoContext';
import { toast } from '../hooks/use-toast';

export const Affiliate: React.FC = () => {
  const { t } = useLanguage();
  const { isDemoMode } = useDemo();
  const [referralCode] = useState('HOOGI-DEMO-123');

  const affiliateStats = isDemoMode ? {
    referrals: 12,
    earnings: 240,
    conversionRate: 8.5,
    pendingPayment: 180
  } : {
    referrals: 0,
    earnings: 0,
    conversionRate: 0,
    pendingPayment: 0
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast({
      title: t('affiliate.copySuccess'),
      description: t('affiliate.copyCodeSuccess')
    });
  };

  const handleCopyLink = () => {
    const referralLink = `${window.location.origin}/register?ref=${referralCode}`;
    navigator.clipboard.writeText(referralLink);
    toast({
      title: t('affiliate.copySuccess'),
      description: t('affiliate.copyLinkSuccess')
    });
  };

  const handleShare = (platform: string) => {
    const referralLink = `${window.location.origin}/register?ref=${referralCode}`;
    const message = t('affiliate.shareMessage');
    
    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(message + ' ' + referralLink)}`);
        break;
      case 'email':
        window.open(`mailto:?subject=Try iHoogi&body=${encodeURIComponent(message + '\n\n' + referralLink)}`);
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`);
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">{t('affiliate.title')}</h1>
          <p className="text-muted-foreground">
            {t('affiliate.subtitle')}
          </p>
        </div>
      </div>

      {/* Hoogi Message */}
      <HoogiMessage 
        message={isDemoMode 
          ? t('affiliate.helpMessageDemo')
          : t('affiliate.helpMessage')
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{affiliateStats.referrals}</p>
                <p className="text-sm text-muted-foreground">{t('affiliate.referrals')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <DollarSign className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">${affiliateStats.earnings}</p>
                <p className="text-sm text-muted-foreground">{t('affiliate.totalEarnings')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{affiliateStats.conversionRate}%</p>
                <p className="text-sm text-muted-foreground">{t('affiliate.conversionRate')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange/10 rounded-lg">
                <DollarSign className="h-6 w-6 text-orange-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">${affiliateStats.pendingPayment}</p>
                <p className="text-sm text-muted-foreground">{t('affiliate.pendingPayment')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('affiliate.referralCodeTitle')}</CardTitle>
            <CardDescription>
              {t('affiliate.referralCodeDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="referral-code">{t('affiliate.referralCode')}</Label>
              <div className="flex gap-2">
                <Input
                  id="referral-code"
                  value={referralCode}
                  readOnly
                  className="font-mono"
                />
                <TooltipWrapper content={t('affiliate.copyCode')}>
                  <Button variant="outline" size="icon" onClick={handleCopyCode}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipWrapper>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="referral-link">{t('affiliate.referralLink')}</Label>
              <div className="flex gap-2">
                <Input
                  id="referral-link"
                  value={`${window.location.origin}/register?ref=${referralCode}`}
                  readOnly
                  className="text-sm"
                />
                <TooltipWrapper content={t('affiliate.copyLink')}>
                  <Button variant="outline" size="icon" onClick={handleCopyLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipWrapper>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('affiliate.shareTitle')}</CardTitle>
            <CardDescription>
              {t('affiliate.shareDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <TooltipWrapper content={t('affiliate.shareWhatsApp')}>
                <Button 
                  variant="outline" 
                  onClick={() => handleShare('whatsapp')}
                  className="justify-start"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  {t('affiliate.shareWhatsApp')}
                </Button>
              </TooltipWrapper>
              
              <TooltipWrapper content={t('affiliate.shareEmail')}>
                <Button 
                  variant="outline" 
                  onClick={() => handleShare('email')}
                  className="justify-start"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  {t('affiliate.shareEmail')}
                </Button>
              </TooltipWrapper>
              
              <TooltipWrapper content={t('affiliate.shareLinkedIn')}>
                <Button 
                  variant="outline" 
                  onClick={() => handleShare('linkedin')}
                  className="justify-start"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  {t('affiliate.shareLinkedIn')}
                </Button>
              </TooltipWrapper>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>{t('affiliate.howItWorksTitle')}</CardTitle>
          <CardDescription>
            {t('affiliate.howItWorksDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Share2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">{t('affiliate.step1Title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('affiliate.step1Desc')}
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
                <Users className="h-6 w-6 text-secondary-foreground" />
              </div>
              <h3 className="font-semibold">{t('affiliate.step2Title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('affiliate.step2Desc')}
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                <DollarSign className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="font-semibold">{t('affiliate.step3Title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('affiliate.step3Desc')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};