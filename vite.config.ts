import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5000,
        host: '0.0.0.0',
        hmr: {
          host: 'localhost',
          port: 5000,
          protocol: 'ws',
        },
        headers: {
          // Required for Firebase signInWithPopup — allows the auth popup to
          // communicate back to the opener via window.closed polling.
          'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
          'Cross-Origin-Embedder-Policy': 'unsafe-none',
        },
        cors: {
          origin: ['http://localhost:5000', 'http://127.0.0.1:5000'],
          credentials: true,
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        target: 'ES2020',
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: true,
            dead_code: true,
            passes: 2,
          },
          mangle: true,
          output: {
            comments: false,
          },
        },
        rollupOptions: {
          output: {
            manualChunks: {
              'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage', 'firebase/functions'],
              'recharts': ['recharts'],
              'vendor': ['react', 'react-dom'],
            },
          },
        },
        chunkSizeWarningLimit: 500,
        sourcemap: false,
        cssCodeSplit: true,
        reportCompressedSize: true,
      }
    };
});
