import React from 'react';
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { HoogiMascot } from "../components/HoogiMascot";
import { useLanguage } from "../contexts/LanguageContext";

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-soft p-4">
      <Card className="w-full max-w-md">
        <CardContent className="text-center space-y-6 p-8">
          <HoogiMascot size="lg" className="mx-auto" />
          <div className="space-y-2">
            <h1 className="text-6xl font-bold text-primary">404</h1>
            <h2 className="text-xl font-semibold text-foreground">{t('notFound.title')}</h2>
            <p className="text-muted-foreground">{t('notFound.message')}</p>
          </div>
          <Button variant="hoogi" size="lg" asChild className="w-full">
            <Link to="/">
              {t('notFound.backHome')}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;