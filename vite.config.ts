
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Fix for __dirname in ESM environments
const __dirname = path.resolve();

export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    // Loads all variables from .env files and merges them with system environment variables.
    const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };
    
    return {
      base: './',
      server: {
        port: 3000,
        strictPort: mode === 'development',
        host: '0.0.0.0',
        allowedHosts: ['gas']
      },
      plugins: [react()],
      // Set publicDir to '.' to ensure root-level folders like 'static/' 
      // are included and served correctly in both dev and production.
      publicDir: 'static/',
      define: {
        'process.env': JSON.stringify({
          API_KEY: env.API_KEY || env.GEMINI_API_KEY || env.VITE_API_KEY || env.VITE_GEMINI_API_KEY || '',
          GEMINI_API_KEY: env.GEMINI_API_KEY || env.API_KEY || env.VITE_GEMINI_API_KEY || env.VITE_API_KEY || '',
          SUPABASE_URL: env.SUPABASE_URL || env.VITE_SUPABASE_URL || '',
          SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || ''
        })
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        target: 'esnext',
        outDir: 'dist',
        emptyOutDir: true,
        copyPublicDir: true,
      }
    };
});
