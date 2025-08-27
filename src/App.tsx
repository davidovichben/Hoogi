import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { DemoProvider } from "./contexts/DemoContext";
import Index from "./pages/Index";
import { Auth } from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";
import { Onboarding } from "./pages/Onboarding";
import OnboardingStep2 from "./pages/OnboardingStep2";
// import { Questionnaires } from "./pages/Questionnaires";
import QuestionnairesList from "./pages/QuestionnairesList";
import Responses from "./pages/Responses";
import Leads from "./pages/Leads";
import { Affiliate } from "./pages/Affiliate";
import { Settings } from "./pages/Settings";
import { Layout } from "./components/Layout";
import NotFound from "./pages/NotFound";
import AppBootLocale from "./components/AppBootLocale";
import AuthCallback from "./pages/AuthCallback";
import RequireAuth from "./components/auth/RequireAuth";
// duplicate import removed
import ProfilePage from "./pages/Profile";
import ReviewAndPublishPage from "./features/questionnaires/review/ReviewAndPublish";
import PublicSharePage from "./pages/PublicSharePage";
import PublicQuestionnaire from "./pages/PublicQuestionnaire";
import QuestionnaireReviewPage from "./pages/QuestionnaireReview";
import QuestionnairePreviewPage from "./pages/QuestionnairePreview";
import DistributionHub from "./pages/DistributionHub";
import Partners from "./pages/Partners";
import { UpdatePassword } from "./pages/auth/UpdatePassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AppBootLocale />
        <DemoProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Auth />} />
              <Route path="/landing" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/update-password" element={<UpdatePassword />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/onboarding/step2" element={<OnboardingStep2 />} />
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
                <Route path="/questionnaires" element={<RequireAuth><QuestionnairesList /></RequireAuth>} />
                {/* create-questionnaire route removed to keep only legacy onboarding flow */}
                <Route path="/responses" element={<RequireAuth><Responses /></RequireAuth>} />
                <Route path="/leads" element={<RequireAuth><Leads /></RequireAuth>} />
                <Route path="/affiliate" element={<RequireAuth><Affiliate /></RequireAuth>} />
                <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
                <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
                {/* Hidden: Old distribution routes - replaced by /distribute
                <Route path="/questionnaires/:id/review" element={<RequireAuth><ReviewAndPublishPage /></RequireAuth>} />
                <Route path="/questionnaires/:id/preview" element={<RequireAuth><QuestionnairePreviewPage /></RequireAuth>} />
                */}
                <Route path="/questionnaires/:token/review" element={<RequireAuth><ReviewAndPublishPage /></RequireAuth>} />
                <Route path="/distribute" element={<RequireAuth><DistributionHub /></RequireAuth>} />
                <Route path="/questionnaire-review" element={<RequireAuth><QuestionnaireReviewPage /></RequireAuth>} />
                <Route path="/partners" element={<RequireAuth><Partners /></RequireAuth>} />
              </Route>
              {/* חדש: דף שיתוף ציבורי - לא דורש התחברות */}
              <Route path="/q/:token" element={<PublicQuestionnaire />} />
              <Route path="*" element={<NotFound />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
</Routes>
          </BrowserRouter>
        </DemoProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
