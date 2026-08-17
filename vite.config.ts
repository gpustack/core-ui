// vite.config.ts
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

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

// Everything in `dependencies` is the host's to resolve, so the host dedupes it
// against its own copy instead of downloading ours alongside it — lodash was
// shipping twice, once inside this bundle and once in the host's. Package
// managers install these for the consumer either way, so nothing has to change
// downstream.
const runtimeDependencies = new Set(
  Object.keys(
    JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf8'))
      .dependencies ?? {}
  )
);

const getPackageName = (id: string) => {
  const segments = id.split('/');
  return id.startsWith('@') ? segments.slice(0, 2).join('/') : segments[0];
};

/**
 * A dependency's JavaScript is the host's to resolve; its assets are not.
 *
 * Vite still has to process those itself — fold CSS into dist/index.css, emit
 * whatever `?worker` / `?url` / `?raw` names — so only bare and .js-ish
 * subpaths go external. Deciding by extension rather than by listing the CSS
 * ones keeps a future asset import from silently becoming external, which
 * fails at runtime in the host rather than here at build time.
 *
 * Subpaths have to be covered at all because matching the package name alone
 * left `highlight.js/lib/core` and its `lib/languages/*` behind: bundled here,
 * while `import('highlight.js')` for the full build resolved from the host, so
 * highlight.js's core shipped twice.
 */
const isJsSubpath = (id: string) =>
  !id.includes('?') && /^[^.]*$|\.[mc]?js$/.test(id.split('/').pop() ?? '');

const isExternalPackage = (id: string) => {
  return (
    exactExternalPackages.has(id) ||
    prefixExternalPackages.some(
      (pkg) => id === pkg || id.startsWith(`${pkg}/`)
    ) ||
    (runtimeDependencies.has(getPackageName(id)) && isJsSubpath(id))
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
        'src/charts.ts',
        'src/markdown.ts',
        'src/terminal.ts',
        'src/utils.ts',
        'src/excel.ts',
        'src/file-readers.ts',
        'src/yaml-editor.ts'
      ],
      // `include` above is whole directories, so specs would otherwise each
      // emit an (empty) declaration into dist. The JS bundles never contain
      // them — rollup only walks the lib entries — this is declarations only.
      exclude: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**'],
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
        charts: resolve(__dirname, 'src/charts.ts'),
        excel: resolve(__dirname, 'src/excel.ts'),
        'file-readers': resolve(__dirname, 'src/file-readers.ts'),
        index: resolve(__dirname, 'src/index.ts'),
        markdown: resolve(__dirname, 'src/markdown.ts'),
        terminal: resolve(__dirname, 'src/terminal.ts'),
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
      // One module in, one module out. Bundling the `index` entry into a single
      // file made the whole package indivisible: tree-shaking works per module,
      // so a host importing one export got all 174 of them, and with them the 41
      // antd components this library touches in total — DatePicker (169KB in a
      // host's bundle) included, on a screen with no date picker. Measured on
      // gpustack-ui: `import { icons }` cost 361KB + 28 antd components before,
      // 4KB and none after.
      //
      // `manualChunks` is gone because it cannot coexist with preserveModules,
      // and it no longer has anything to group — the packages it split out
      // (mammoth/jszip/xlsx) are external now.
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        // Applies to every emitted module in preserveModules mode, not just the
        // entries, so the `exports` map keeps resolving `dist/index.es.js`.
        entryFileNames: '[name].es.js',
        chunkFileNames: '[name]-[hash].js'
      }
    }
  }
});
