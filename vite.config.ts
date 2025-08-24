import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  console.log('Environment variables loaded:', {
    SUPABASE_URL: env.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY ? '***' : 'MISSING'
  });
  
  return {
    plugins: [
      react(),
      // פתרון 4: Vite Plugin מותאם אישית לטיפול בבעיית Supabase
      {
        name: 'supabase-fix-plugin',
        configResolved(config) {
          console.log('[SUPABASE PLUGIN] Plugin loaded successfully');
        },
        transform(code, id) {
          // אם זה קובץ Supabase, תקן אותו
          if (id.includes('@supabase/supabase-js')) {
            console.log('[SUPABASE PLUGIN] Transforming Supabase file:', id);
            // מניעת יצירת שמות קבצים בעייתיים
            return code.replace(/import\.meta\.env/g, 'process.env');
          }
          return code;
        },
        generateBundle(options, bundle) {
          // מניעת יצירת קבצים עם שמות בעייתיים
          Object.keys(bundle).forEach(fileName => {
            if (fileName.includes('@supabase_supabase-js')) {
              console.log('[SUPABASE PLUGIN] Preventing problematic file:', fileName);
              delete bundle[fileName];
            }
          });
        }
      }
    ],
    base: '/', // חשוב: לא להפנות לדומיין חיצוני
    resolve: { 
      alias: { 
        "@": path.resolve(__dirname, "./src") 
      } 
    },
    server: { host: true, port: 8080, strictPort: false },
    preview: { host: true, port: 8080 },
    // Ensure environment variables are loaded
    define: {
      'process.env': env,
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY)
    },
    // פתרון 2: Bundle Supabase כחלק מהקוד
    optimizeDeps: {
      include: ['@supabase/supabase-js'],
      force: true // כפייה לטעינה מחדש
    },
    build: {
      sourcemap: true,
      target: 'esnext',
      rollupOptions: {
        // ❗ אל תוציא את @supabase/supabase-js ל-external
        external: [], // בטל external לגמרי
        output: {
          // מניעת שמות "נקיים" שיוצרים @supabase_supabase-js.js
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
          // בטל manualChunks הבעייתי
          manualChunks: undefined,
          // הוסף globals למניעת טעינה חיצונית
          globals: {
            '@supabase/supabase-js': 'supabase'
          }
        }
      }
    }
  };
});
