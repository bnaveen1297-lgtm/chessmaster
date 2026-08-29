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
      // The shared ../src modules import bare packages (e.g. chess.js) that are
      // declared in web/package.json. Because those files live outside web/,
      // node resolution walks up to the repo-root node_modules, which Vercel
      // never installs. Pin the bare imports to web/node_modules explicitly.
      { find: /^chess\.js$/, replacement: path.resolve(__dirname, 'node_modules/chess.js') },
    ],
  },
  // The shared modules live in ../src, whose nearest tsconfig is the repo-root
  // one that `extends: "expo/tsconfig.base"`. On Vercel only web/'s deps are
  // installed (no root node_modules), so esbuild can't resolve that extends and
  // the build fails. Supplying tsconfigRaw makes esbuild skip the on-disk
  // tsconfig lookup entirely and use these options for every file instead.
  esbuild: {
    tsconfigRaw: JSON.stringify({
      compilerOptions: {
        target: 'es2020',
        useDefineForClassFields: true,
        jsx: 'react-jsx',
      },
    }),
  },
  server: { fs: { allow: ['..'] } },
});
