
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Fix for __dirname in ESM environments
const __dirname = path.resolve();

export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    // Loads all variables regardless of the VITE_ prefix.
    const env = loadEnv(mode, process.cwd(), '');
    
    return {
      server: {
        port: 3000,
        strictPort: mode === 'development',
        host: '0.0.0.0',
      },
      plugins: [react()],
      // Set publicDir to '.' to ensure root-level folders like 'static/' 
      // are included and served correctly in both dev and production.
      publicDir: 'static/',
      define: {
        // Map common API key names to ensure compatibility with various .env setups
        'process.env.API_KEY': JSON.stringify(env.API_KEY || env.GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY || ''),
        'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL || ''),
        'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY || '')
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
