import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { ProfileCompletionGuard } from './core/guards/profile-completion.guard';
import { CanDeactivateGuard } from './core/guards/can-deactivate.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/landing', pathMatch: 'full' },
  { path: 'landing', loadComponent: () => import('./pages/landing/landing.component').then(m => m.LandingComponent) },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'auth', redirectTo: '/login', pathMatch: 'full' },
  { path: 'register', loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent) },
  { path: 'terms', loadComponent: () => import('./pages/terms/terms.component').then(m => m.TermsComponent) },
  { path: 'onboarding', loadComponent: () => import('./pages/onboarding/onboarding.component').then(m => m.OnboardingComponent) },
  { path: 'auth/update-password', loadComponent: () => import('./pages/update-password/update-password.component').then(m => m.UpdatePasswordComponent) },
  { path: 'q/:token', loadComponent: () => import('./pages/questionnaire-live/questionnaire-live').then(m => m.QuestionnaireLive) },
  { path: 'q/:token/chat', loadComponent: () => import('./pages/questionnaire-chat/questionnaire-chat').then(m => m.QuestionnaireChat) },
  { path: 'q/:token/qr', loadComponent: () => import('./pages/questionnaire-qr/questionnaire-qr.component').then(m => m.QuestionnaireQrComponent) },
  { path: 'questionnaires/chat/preview', loadComponent: () => import('./pages/questionnaire-chat/questionnaire-chat').then(m => m.QuestionnaireChat) },
  { path: 'questionnaires/live/preview', loadComponent: () => import('./pages/questionnaire-live/questionnaire-live').then(m => m.QuestionnaireLive) },
  {
    path: '',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'questionnaires', loadComponent: () => import('./pages/questionnaires/questionnaires.component').then(m => m.QuestionnairesComponent) },
      { path: 'questionnaires/new', loadComponent: () => import('./pages/create-questionnaire/create-questionnaire.component').then(m => m.CreateQuestionnaireComponent), canDeactivate: [CanDeactivateGuard] },
      { path: 'questionnaires/edit/:id', loadComponent: () => import('./pages/create-questionnaire/create-questionnaire.component').then(m => m.CreateQuestionnaireComponent), canDeactivate: [CanDeactivateGuard] },
      { path: 'questionnaires/live/:id', loadComponent: () => import('./pages/questionnaire-live/questionnaire-live').then(m => m.QuestionnaireLive) },
      { path: 'questionnaires/chat/:id', loadComponent: () => import('./pages/questionnaire-chat/questionnaire-chat').then(m => m.QuestionnaireChat) },
      { path: 'responses', redirectTo: '/leads', pathMatch: 'full' },
      { path: 'leads', loadComponent: () => import('./pages/leads/leads.component').then(m => m.LeadsComponent) },
      {
        path: 'automations',
        loadComponent: () => import('./pages/automations/automations.component').then(m => m.AutomationsComponent),
        children: [
          { path: '', loadComponent: () => import('./pages/automations/create-automation-template/create-automation-template.component').then(m => m.CreateAutomationTemplateComponent) },
          { path: 'edit/:id', loadComponent: () => import('./pages/automations/create-automation-template/create-automation-template.component').then(m => m.CreateAutomationTemplateComponent) }
        ]
      },
      { path: 'templates', loadComponent: () => import('./pages/automations/templates-list/templates-list.component').then(m => m.TemplatesListComponent) },
      { path: 'settings', loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent) },
      { path: 'profile', loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent), canDeactivate: [ProfileCompletionGuard] },
      { path: 'partners', loadComponent: () => import('./pages/partners/partners.component').then(m => m.PartnersComponent) },
      { path: 'distribution-hub', loadComponent: () => import('./pages/distribution-hub/distribution-hub.component').then(m => m.DistributionHubComponent) },
      { path: 'contact', loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent) }
    ]
  },
  { path: '**', loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent) }
];
