declare interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_SITE_URL: string;
  readonly VITE_DEFAULT_LOCALE?: string;
  readonly VITE_APP_NAME?: string;
}
declare interface ImportMeta { readonly env: ImportMetaEnv }
