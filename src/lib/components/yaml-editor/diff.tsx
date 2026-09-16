import { LoadingOutlined } from '@ant-design/icons';
import { createStyles } from 'antd-style';
import classNames from 'classnames';
import { forwardRef, lazy, Suspense, useImperativeHandle, useRef } from 'react';
import EditorWrap from '../editor-wrap';
import type { DiffEditorHandle, DiffViewerProps } from './editor';

// Same boundary as `YamlEditor`, and deliberately the same module: monaco is
// pinned into whichever chunk imports it, so sharing `./editor` means the
// first of the two editors a session reaches pays for monaco and the other
// one is free. See `preloadYamlEditor` for starting that earlier.
const DiffInner = lazy(() =>
  import('./editor').then((module) => ({ default: module.DiffEditorInner }))
);

const useStyles = createStyles(({ css }) => ({
  container: css`
    border: 1px solid var(--ant-color-border);
    border-radius: var(--ant-border-radius-lg);
    overflow: hidden;
    .monaco-editor .scroll-decoration {
      box-shadow: none;
    }
  `,
  loading: css`
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ant-color-text-tertiary);
  `
}));

export type YamlDiffEditorHandle = DiffEditorHandle;

// Derived rather than restated. The two differ in one prop — how the theme is
// named — and a hand-copied twin is exactly how a prop comes to be declared
// here and silently dropped at the call site below.
export type YamlDiffEditorProps = Omit<DiffViewerProps, 'theme'> & {
  isDarkTheme?: boolean;
};

const YamlDiffEditor = forwardRef<YamlDiffEditorHandle, YamlDiffEditorProps>(
  (
    {
      original,
      modified,
      height = 380,
      header,
      isDarkTheme,
      readOnly,
      onBlur,
      onChange
    },
    ref
  ) => {
    const { styles } = useStyles();
    const innerRef = useRef<YamlDiffEditorHandle>(null);

    // Not `ref` handed straight down: for the whole of monaco's download there
    // is no inner component to hold it, so a caller reading through it would
    // get nothing back — and a drawer Esc'd during exactly that download is
    // the case this handle exists for. Nothing can have been typed yet, so
    // `modified` is what the buffer would have said.
    useImperativeHandle(
      ref,
      () => ({
        getValue: () => innerRef.current?.getValue() ?? modified
      }),
      [modified]
    );

    return (
      <div
        className={classNames(styles.container, 'yaml-diff-editor-container')}
      >
        <Suspense
          fallback={
            // The wrapper the editor is about to render into, header and all,
            // so a slow first load reads as one loading rather than as a gap
            // that jumps by the header's height once monaco arrives.
            <EditorWrap header={header}>
              <div className={styles.loading} style={{ height }}>
                <LoadingOutlined style={{ fontSize: 24 }} />
              </div>
            </EditorWrap>
          }
        >
          <DiffInner
            ref={innerRef}
            original={original}
            modified={modified}
            height={height}
            header={header}
            theme={isDarkTheme ? 'vs-dark' : 'light'}
            readOnly={readOnly}
            onBlur={onBlur}
            onChange={onChange}
          />
        </Suspense>
      </div>
    );
  }
);

export default YamlDiffEditor;
