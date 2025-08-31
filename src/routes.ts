export const routes = {
  home: "/",
  dashboard: "/dashboard",
  questionnaires: "/questionnaires",
  responses: "/responses",
  leads: "/leads",
  affiliate: "/affiliate",
  settings: "/settings",
  profile: "/profile",
  distributeHub: "/distribute",
  publicQuestionnaire: (token: string) => `/q/${token}`,
  authCallback: "/auth/callback",
  questionnaireReviewById: (id: string | number) =>
    `/questionnaires/${id}/review`,
  questionnaireDistributeById: (id: string | number) =>
    `/questionnaires/${id}/distribute`,
} as const;
export type AppRoute = string;
