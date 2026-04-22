// vite.config.ts
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

//
export default defineConfig({
  base: './',
  plugins: [
    react(),
    dts({
      tsconfigPath: './tsconfig.app.json',
      include: ['src/lib', 'src/index.ts'],
      entryRoot: 'src',
      compilerOptions: {
        noEmit: false,
        allowImportingTsExtensions: false
      }
    })
  ],
  css: {
    modules: {
      generateScopedName: '[name]__[local]___[hash:base64:5]'
    }
  },
  optimizeDeps: {
    include: ['monaco-editor']
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'CoreUI',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format}.js`
    },
    cssCodeSplit: true,
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'antd'
      ],
      output: {
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'monaco-editor') {
            return 'monaco-editor-[hash].js';
          }

          return '[name]-[hash].js';
        },
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          antd: 'antd'
        },
        manualChunks: (id) => {
          if (
            id.includes('/node_modules/monaco-editor/') ||
            id.includes('/node_modules/@monaco-editor/react/') ||
            id.includes('/node_modules/monaco-yaml/')
          ) {
            return 'monaco-editor';
          }
        }
      }
    }
  }
});
