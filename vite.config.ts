
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all envs regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Injects the API_KEY into the client-side code as process.env.API_KEY
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY),
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'terser',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', '@google/genai', 'recharts', 'zustand'],
            math: ['react-markdown', 'remark-math', 'rehype-katex'],
          },
        },
      },
    },
  };
});
