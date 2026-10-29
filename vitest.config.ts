import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Monaco 0.30 exposes a browser module without a Node entry point.
    alias: [
      {
        find: /^monaco-editor$/,
        replacement: fileURLToPath(
          new URL(
            './node_modules/monaco-editor/esm/vs/editor/editor.api.js',
            import.meta.url
          )
        )
      }
    ]
  },
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts']
  }
});
