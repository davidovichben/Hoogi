import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { HoogiMascot } from '../components/HoogiMascot';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  MessageSquareIcon, 
  TrendingUpIcon, 
  UsersIcon, 
  BrainIcon,
  CheckCircleIcon,
  ArrowLeftIcon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

const Index = () => {
  const { language, t } = useLanguage();

  useEffect(() => {
    const pingSupabase = async () => {
      const { error } = await supabase.from('questionnaires').select('*').limit(1);
      console.log('DB ping:', error ? error.message : 'OK');
    };
    pingSupabase();
  }, []);

  const features = [
    {
      icon: MessageSquareIcon,
      title: language === 'he' ? 'תשובות אוטומטיות' : 'Automated Responses',
      description: language === 'he' ? 'הוגי עונה אוטומטית על שאלות הלקוחות שלכם' : 'Hoogi automatically answers your customers\' questions'
    },
    {
      icon: BrainIcon,
      title: language === 'he' ? 'בינה מלאכותית מתקדמת' : 'Advanced AI',
      description: language === 'he' ? 'טכנולוגיה חכמה הלומדת מהתנהגות הלקוחות' : 'Smart technology that learns from customer behavior'
    },
    {
      icon: TrendingUpIcon,
      title: language === 'he' ? 'שיפור המכירות' : 'Sales Improvement',
      description: language === 'he' ? 'המרה גבוהה יותר של מבקרים ללקוחות' : 'Higher conversion of visitors to customers'
    },
    {
      icon: UsersIcon,
      title: language === 'he' ? 'ניהול לידים' : 'Lead Management',
      description: language === 'he' ? 'מעקב וניהול יעיל של לקוחות פוטנציאליים' : 'Efficient tracking and management of potential customers'
    }
  ];

  const benefits = [
    language === 'he' ? 'חיסכון בזמן צוות השירות' : 'Save customer service team time',
    language === 'he' ? 'זמינות 24/7 ללקוחות' : '24/7 availability for customers', 
    language === 'he' ? 'שיפור שביעות הרצון' : 'Improve customer satisfaction',
    language === 'he' ? 'העלאת שיעור ההמרה' : 'Increase conversion rates'
  ];

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <HoogiMascot size="lg" className="animate-glow" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            {language === 'he' ? 'מערכת iHoogi' : 'iHoogi System'}
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            {language === 'he' 
              ? 'מערכת תשובות אוטומטיות מתקדמת עם דמות המותג הוגי - הפתרון החכם לשירות לקוחות מעולה'
              : 'Advanced automated response system with Hoogi brand character - the smart solution for excellent customer service'
            }
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button variant="hoogi" size="lg" asChild>
              <Link to="/auth">
                {language === 'he' ? 'התחל עכשיו' : 'Get Started'}
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/auth">
                {language === 'he' ? 'התחבר למערכת' : 'Sign In'}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-primary">
            {language === 'he' ? 'למה לבחור ב-iHoogi?' : 'Why Choose iHoogi?'}
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <feature.icon className="w-12 h-12 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-8 text-primary">
                {language === 'he' ? 'היתרונות שלכם' : 'Your Benefits'}
              </h3>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircleIcon className="w-6 h-6 text-secondary flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
              <Button variant="hoogi" size="lg" className="mt-8" asChild>
                <Link to="/auth">
                  {language === 'he' ? 'בואו נתחיל!' : 'Let\'s Get Started!'}
                </Link>
              </Button>
            </div>
            
            <div className="flex justify-center">
              <HoogiMascot size="lg" className="animate-glow" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-primary">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-6 text-primary-foreground">
            {language === 'he' ? 'מוכנים לשפר את שירות הלקוחות שלכם?' : 'Ready to Improve Your Customer Service?'}
          </h3>
          <p className="text-xl text-primary-foreground/80 mb-8">
            {language === 'he' 
              ? 'הצטרפו לעסקים רבים שכבר משתמשים ב-iHoogi לשיפור החוויה של הלקוחות'
              : 'Join many businesses already using iHoogi to improve customer experience'
            }
          </p>
          <Button variant="secondary" size="lg" asChild>
            <Link to="/auth">
              {language === 'he' ? 'התחילו היום בחינם' : 'Start Free Today'}
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
