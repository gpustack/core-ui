import { LoadingOutlined } from '@ant-design/icons';
import type { EditorProps } from '@monaco-editor/react';
import { Flex } from 'antd';
import { lazy, Suspense } from 'react';

export interface JsonEditorProps {
  value: string;
  height?: string | number;
  /** Stable model URI; omitted paths are unique to each mounted editor. */
  path?: string;
  /** Inline JSON schema, registered only for this editor's model. */
  schema?: Record<string, unknown>;
  isDarkTheme?: boolean;
  options?: EditorProps['options'];
  onChange?: EditorProps['onChange'];
}

// JSON, YAML and diff editors share the same lazy runtime and local loader.
const Editor = lazy(() =>
  import('../yaml-editor/editor').then(({ JsonEditorInner }) => ({
    default: JsonEditorInner
  }))
);

export default function JsonEditor({
  height = 380,
  ...props
}: JsonEditorProps) {
  return (
    <Suspense
      fallback={
        <Flex align="center" justify="center" style={{ height }}>
          <LoadingOutlined style={{ fontSize: 24 }} />
        </Flex>
      }
    >
      <Editor {...props} height={height} />
    </Suspense>
  );
}
