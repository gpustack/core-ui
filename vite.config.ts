// vite.config.ts
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

//
export default defineConfig({
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
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
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
      external: ['react', 'react-dom', 'antd'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          antd: 'antd'
        }
      }
    }
  }
});
