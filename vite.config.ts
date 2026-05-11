// vite.config.ts
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const libraryChunks: Record<string, string> = {
  mammoth: 'mammoth',
  jszip: 'jszip',
  'pdfjs-dist': 'pdfjs-dist',
  xlsx: 'xlsx',
  epubjs: 'epubjs'
};

const exactExternalPackages = new Set([
  'react',
  'react-dom',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  'file-saver',
  'axios',
  '@monaco-editor/react',
  'monaco-editor',
  'monaco-yaml',
  'styled-components',
  'antd-style',
  'ahooks',
  '@ant-design/pro-components',
  '@ant-design/icons',
  'overlayscrollbars-react'
]);

const prefixExternalPackages = ['antd', 'echarts'];

const isExternalPackage = (id: string) => {
  return (
    exactExternalPackages.has(id) ||
    prefixExternalPackages.some((pkg) => id === pkg || id.startsWith(`${pkg}/`))
  );
};

//
export default defineConfig({
  base: './',
  plugins: [
    react(),
    dts({
      tsconfigPath: './tsconfig.app.json',
      include: [
        'src/lib',
        'src/index.ts',
        'src/markdown.ts',
        'src/utils.ts',
        'src/excel.ts',
        'src/file-readers.ts',
        'src/yaml-editor.ts'
      ],
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
  build: {
    lib: {
      entry: {
        excel: resolve(__dirname, 'src/excel.ts'),
        'file-readers': resolve(__dirname, 'src/file-readers.ts'),
        index: resolve(__dirname, 'src/index.ts'),
        markdown: resolve(__dirname, 'src/markdown.ts'),
        utils: resolve(__dirname, 'src/utils.ts'),
        'yaml-editor': resolve(__dirname, 'src/yaml-editor.ts')
      },
      name: 'CoreUI',
      formats: ['es'],
      cssFileName: 'index',
      fileName: (format, entryName) => `${entryName}.${format}.js`
    },
    cssCodeSplit: false,
    rollupOptions: {
      external: isExternalPackage,
      output: {
        chunkFileNames: '[name]-[hash].js',
        manualChunks: (id) => {
          for (const [pkg, chunkName] of Object.entries(libraryChunks)) {
            if (id.includes(`/node_modules/${pkg}/`)) {
              return chunkName;
            }
          }
        }
      }
    }
  }
});
