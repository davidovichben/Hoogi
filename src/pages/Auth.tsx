import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';
import { toast } from '../hooks/use-toast';
import { HoogiMascot, HoogiMessage } from '../components/HoogiMascot';
import { TooltipWrapper } from '../components/TooltipWrapper';
import { supabase } from "@/integrations/supabase/client";
import { upsertProfile, fetchProfile } from "../lib/profile";
import { useLanguage } from "../contexts/LanguageContext";
import { ArrowRightIcon, MailIcon, KeyIcon, ArrowLeftIcon } from 'lucide-react';

export const Auth = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'login'|'register'>('login');
  const [preferredLocale, setPreferredLocale] = useState<'he'|'en'>('he');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [canLoginNow, setCanLoginNow] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password
    });
    setIsLoading(false);
    if (error) { toast({ title: error.message, variant: 'destructive' }); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      try {
        const p = await fetchProfile(user.id);
        if (p?.locale) setLanguage(p.locale as 'he'|'en');
      } catch {}
    }
    toast({ title: language==='he' ? 'ברוך השב!' : 'Welcome back!' });
    navigate('/dashboard');
  };

  // One-click: Sign up (if needed) and then sign in, then navigate
  const handleRegisterAndLogin = async () => {
    setIsLoading(true);
    try {
      // Try sign up first (idempotent for existing users – Supabase may return error if exists)
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { locale: preferredLocale } }
      });
      if (!error && data.user?.id) {
        try { await upsertProfile(data.user.id, { locale: preferredLocale }); } catch {}
      }

      // Then sign in with the same credentials
      const { error: loginErr } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (loginErr) {
        toast({ title: loginErr.message, variant: 'destructive' });
        setIsLoading(false);
        return;
      }
      navigate('/dashboard');
    } catch (e: any) {
      toast({ title: e?.message || String(e), variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({ title: language==='he' ? 'סיסמאות לא תואמות' : 'Password mismatch', variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);
    
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: { data: { locale: preferredLocale } }
    });
    setIsLoading(false);
    if (error) { toast({ title: error.message, variant: 'destructive' }); return; }
    if (data.user?.id) {
      try { await upsertProfile(data.user.id, { locale: preferredLocale }); } catch {}
      setLanguage(preferredLocale);
    }
    setCanLoginNow(true);
    // If confirmation is not required, a session will exist and we can go straight to the app
    if (data.session) {
      toast({ title: language==='he' ? 'נרשמת בהצלחה, נכנסים…' : 'Account created, signing you in…' });
      navigate('/dashboard');
      return;
    }
    // Otherwise, try to sign-in automatically (in case confirmation is disabled at runtime)
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });
    if (!signInErr) {
      toast({ title: language==='he' ? 'נכנסים…' : 'Signing you in…' });
      navigate('/dashboard');
      return;
    }
    // Fallback: move to login tab and ask the user to sign in manually
    toast({ title: language==='he' ? 'נרשמת בהצלחה – היכנס/י עם האימייל והסיסמה' : 'Account created – please sign in' });
    setActiveTab('login');
  };

  const handleDirectLogin = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });
    setIsLoading(false);
    if (error) { toast({ title: error.message, variant: 'destructive' }); return; }
    navigate('/dashboard');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'he' ? 'en' : 'he');
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Back to Home Button */}
      <div className="absolute top-4 left-4 z-10">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2">
          <ArrowLeftIcon className="w-4 h-4" />
          {language === 'he' ? 'חזרה לדף הבית' : 'Back to Home'}
        </Button>
      </div>

      {/* Language Toggle - Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-lg p-2 border border-primary/20">
          <span className={`text-sm ${language === 'en' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
            EN
          </span>
          <TooltipWrapper content={language === 'he' ? 'החלף שפה' : 'Switch Language'}>
            <Switch
              checked={language === 'he'}
              onCheckedChange={toggleLanguage}
              className="data-[state=checked]:bg-primary"
            />
          </TooltipWrapper>
          <span className={`text-sm ${language === 'he' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
            עב
          </span>
        </div>
      </div>

      <div className="flex min-h-screen">
        {/* Left Side - Hero Section */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-primary items-center justify-center p-12">
          <div className="text-center text-primary-foreground max-w-md">
            <HoogiMascot size="lg" className="mx-auto mb-8 animate-glow" />
            <h1 className="text-4xl font-bold mb-6">
              {language === 'he' ? 'ברוכים הבאים ל-iHoogi' : 'Welcome to iHoogi'}
            </h1>
            <p className="text-xl opacity-90 mb-8">
              {language === 'he' 
                ? 'מערכת תשובות אוטומטיות מתקדמת עם הוגי - הדמות החכמה שלכם'
                : 'Advanced automated response system with Hoogi - your smart character'
              }
            </p>
            <div className="space-y-4 text-left">
              {[
                language === 'he' ? '🚀 תשובות מיידיות ללקוחות' : '🚀 Instant customer responses',
                language === 'he' ? '🎯 שיפור שיעור ההמרה' : '🎯 Improved conversion rates',
                language === 'he' ? '📈 ניתוח וניהול לידים' : '📈 Lead analysis and management',
                language === 'he' ? '⚡ זמינות 24/7' : '⚡ 24/7 availability'
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-secondary text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Auth Forms */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-8">
              <HoogiMascot size="md" className="mx-auto mb-4 animate-glow" />
              <h1 className="text-2xl font-bold text-primary mb-2">
                {language === 'he' ? 'ברוכים הבאים ל-iHoogi' : 'Welcome to iHoogi'}
              </h1>
            </div>

            {/* Hoogi Welcome Message */}
            <HoogiMessage
              message={language === 'he' 
                ? "שלום! אני הוגי, העוזר החכם שלכם. בואו נתחיל יחד במסע לשיפור שירות הלקוחות שלכם!"
                : "Hello! I'm Hoogi, your smart assistant. Let's start together on a journey to improve your customer service!"
              }
              className="mb-6"
            />

            <Card className="border-primary/20 shadow-xl bg-background/95 backdrop-blur-sm">
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl text-primary">
                  {language === 'he' ? 'בואו נתחיל' : 'Let\'s Get Started'}
                </CardTitle>
                <CardDescription>
                  {language === 'he' ? 'בחרו את הדרך המועדפת עליכם' : 'Choose your preferred method'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={(v)=>setActiveTab(v as 'login'|'register')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger 
                      value="login" 
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      {language === 'he' ? 'כניסה' : 'Sign In'}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="register" 
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      {language === 'he' ? 'הרשמה' : 'Sign Up'}
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                          <MailIcon className="w-4 h-4 text-primary" />
                          {language === 'he' ? 'כתובת אימייל' : 'Email Address'}
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder={language === 'he' ? 'הכניסו את האימייל שלכם' : 'Enter your email'}
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          className="border-primary/30 focus:border-primary h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password" className="flex items-center gap-2">
                          <KeyIcon className="w-4 h-4 text-primary" />
                          {language === 'he' ? 'סיסמה' : 'Password'}
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder={language === 'he' ? 'הכניסו את הסיסמה שלכם' : 'Enter your password'}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required
                          className="border-primary/30 focus:border-primary h-12"
                        />
                      </div>
                      <Button type="submit" className="w-full h-12" variant="hoogi" disabled={isLoading}>
                        {isLoading 
                          ? (language === 'he' ? 'כניסה...' : 'Signing in...') 
                          : (language === 'he' ? 'כניסה למערכת' : 'Sign In')
                        }
                        {!isLoading && <ArrowRightIcon className="w-4 h-4 ml-2" />}
                      </Button>
                      <Button type="button" variant="secondary" className="w-full h-10" onClick={()=>setActiveTab('register')}>
                        {language==='he' ? 'אין לכם חשבון? הרשמה' : "Don't have an account? Sign Up"}
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="register">
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-email" className="flex items-center gap-2">
                          <MailIcon className="w-4 h-4 text-primary" />
                          {language === 'he' ? 'כתובת אימייל' : 'Email Address'}
                        </Label>
                        <Input
                          id="register-email"
                          type="email"
                          placeholder={language === 'he' ? 'הכניסו את האימייל שלכם' : 'Enter your email'}
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          className="border-primary/30 focus:border-primary h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-password" className="flex items-center gap-2">
                          <KeyIcon className="w-4 h-4 text-primary" />
                          {language === 'he' ? 'סיסמה' : 'Password'}
                        </Label>
                        <Input
                          id="register-password"
                          type="password"
                          placeholder={language === 'he' ? 'בחרו סיסמה חזקה' : 'Choose a strong password'}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required
                          className="border-primary/30 focus:border-primary h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password" className="flex items-center gap-2">
                          <KeyIcon className="w-4 h-4 text-primary" />
                          {language === 'he' ? 'אימות סיסמה' : 'Confirm Password'}
                        </Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder={language === 'he' ? 'הכניסו את הסיסמה שוב' : 'Enter password again'}
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          required
                          className="border-primary/30 focus:border-primary h-12"
                        />
                      </div>
                      <div className="mb-2">
                        <label className="block text-sm mb-1">{language==='he'?'שפה ברישום':'Registration language'}</label>
                        <select value={preferredLocale} onChange={(e)=>setPreferredLocale(e.target.value as 'he'|'en')}
                                className="border rounded px-2 py-1 w-full">
                          <option value="he">עברית</option>
                          <option value="en">English</option>
                        </select>
                      </div>
                      <Button type="submit" className="w-full h-12" variant="hoogi" disabled={isLoading}>
                        {isLoading 
                          ? (language === 'he' ? 'יוצר חשבון...' : 'Creating account...') 
                          : (language === 'he' ? 'יצירת חשבון' : 'Create Account')
                        }
                        {!isLoading && <ArrowRightIcon className="w-4 h-4 ml-2" />}
                      </Button>
                      <Button type="button" className="w-full h-12 font-semibold" variant="yellow" onClick={handleRegisterAndLogin} disabled={isLoading}>
                        {language==='he' ? 'כניסה' : 'Enter'}
                      </Button>
                      {canLoginNow && (
                        <Button type="button" className="w-full h-12" variant="teal" onClick={handleDirectLogin} disabled={isLoading}>
                          {language==='he' ? 'היכנס' : 'Enter App'}
                        </Button>
                      )}
                      <Button type="button" variant="secondary" className="w-full h-10" onClick={()=>setActiveTab('login')}>
                        {language==='he' ? 'כבר יש חשבון? כניסה' : 'Already have an account? Sign In'}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Mobile Features */}
            <div className="lg:hidden mt-8 text-center">
              <p className="text-muted-foreground text-sm mb-4">
                {language === 'he' ? 'למה לבחור ב-iHoogi?' : 'Why choose iHoogi?'}
              </p>
              <div className="grid grid-cols-2 gap-4 text-xs">
                {[
                  language === 'he' ? 'תשובות מיידיות' : 'Instant responses',
                  language === 'he' ? 'זמינות 24/7' : '24/7 availability',
                  language === 'he' ? 'ניהול לידים' : 'Lead management',
                  language === 'he' ? 'שיפור המכירות' : 'Sales improvement'
                ].map((feature, index) => (
                  <div key={index} className="text-center p-2 bg-primary/5 rounded-lg">
                    <span className="text-primary font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};