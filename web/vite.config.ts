import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// The web app reuses the framework-agnostic logic in ../src (engine, rules,
// data, and the Supabase service layer). Those services import their Supabase
// client via a relative './supabase' — we redirect that single module to the
// browser client below, so everything else is shared verbatim.
const redirectSupabase = {
  name: 'redirect-shared-supabase',
  enforce: 'pre' as const,
  resolveId(source: string, importer?: string) {
    if (source === './supabase' && importer && importer.replace(/\\/g, '/').includes('/src/services/')) {
      return path.resolve(__dirname, 'src/lib/supabase.ts');
    }
    return null;
  },
};

export default defineConfig({
  plugins: [redirectSupabase, react()],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'src') },
      { find: '@shared', replacement: path.resolve(__dirname, '../src') },
    ],
  },
  server: { fs: { allow: ['..'] } },
});
