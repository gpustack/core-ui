import { ImportOutlined, LoadingOutlined } from '@ant-design/icons';
import { Button, message, Typography, Upload } from 'antd';
import { type RcFile } from 'antd/lib/upload';
import React, {
  forwardRef,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef
} from 'react';
import styled from 'styled-components';
import { useIntl } from '../../hooks/useIntl';

// `monaco-editor` is ~2.5MB parsed and it is pinned into whatever chunk
// imports it — a static `./editor` import would make every consumer route
// block on it before first paint, even though the editor only ever renders
// inside a drawer/modal the user has to open. Keep the whole monaco surface
// (`monaco-editor`, `monaco-yaml`, `loader.config`) behind this boundary:
// `./editor` is the ONLY module allowed to touch it.
const EditorInner = lazy(() => import('./editor'));

const { Text } = Typography;

const Container = styled.div`
  position: relative;
  border: 1px solid var(--ant-color-border);
  border-radius: var(--ant-border-radius-lg);
  .monaco-editor .scroll-decoration {
    box-shadow: none;
  }
  .monaco-editor {
    border-radius: 0 0 var(--ant-border-radius-lg) var(--ant-border-radius-lg);
    overflow: hidden;
  }
`;

const ErrorText = styled(Text)`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 4px 6px;
  background-color: var(--ant-color-bg-elevated);
  border-radius: 0 0 var(--ant-border-radius-lg) var(--ant-border-radius-lg);
`;

const Loading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ant-color-text-tertiary);
`;

const Header = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding-inline: 10px;
  font-size: 14px;
  border-bottom: 1px solid var(--ant-color-border);
  background-color: var(--ant-color-fill-quaternary);
  border-radius: var(--ant-border-radius-lg) var(--ant-border-radius-lg) 0 0;
`;

interface ViewerProps {
  ref?: any;
  title?: React.ReactNode;
  defaultLang?: string;
  config?: any;
  value: string;
  height?: string | number;
  placeholder?: string;
  variant?: 'bordered' | 'borderless';
  validateMessage?: React.ReactNode;
  schema?: any;
  isDarkTheme?: boolean;
  onUpload?: (content: string) => void;
  onChange?: (value: string | undefined, event: any) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

const YamlEditor: React.FC<ViewerProps> = forwardRef((props, ref) => {
  const {
    value,
    height = 380,
    variant = 'borderless',
    isDarkTheme,
    schema,
    placeholder,
    validateMessage,
    title,
    onUpload,
    onChange,
    onBlur,
    onFocus
  } = props;

  const intl = useIntl();

  const editorRef = useRef<any>(null);
  const pendingValueRef = useRef<string | null>(null);

  // monaco is lazy-loaded, so `editorRef` is empty for the first few hundred
  // ms after mount. Callers push content imperatively (the inner editor pins
  // its model to a fixed path, so a remount reuses the old model instead of
  // the `value` prop) and that push used to land on a null ref and vanish.
  // Buffer it here and flush on attach — every consumer gets the guarantee
  // once, instead of each one polling for the editor to come up.
  const setContent = (val: string) => {
    if (editorRef.current?.setValue) {
      editorRef.current.setValue(val);
    } else {
      pendingValueRef.current = val;
    }
  };

  // monaco's `createModel` throws an opaque `factory.create is not a function`
  // on anything but a string, and it takes down the whole drawer. Callers with
  // a structured config must serialize it themselves — core-ui can't, because
  // the parse side may use a custom YAML schema (tags, key order) that only
  // the caller knows. So: keep the editor alive, and say what went wrong.
  const safeValue = typeof value === 'string' ? value : '';
  if (value != null && typeof value !== 'string') {
    console.error(
      '[YamlEditor] `value` must be a YAML string, received',
      typeof value,
      '— serialize it before passing it in.'
    );
  }

  // Stable identity on purpose: an inline callback ref is re-created every
  // render, which makes React detach (call with null) and re-attach on each
  // one — the flush below would then run against a torn-down editor.
  const attachEditor = useCallback((instance: any) => {
    editorRef.current = instance;
    if (instance && pendingValueRef.current !== null) {
      instance.setValue?.(pendingValueRef.current);
      pendingValueRef.current = null;
    }
  }, []);

  const beforeUpload = (file: RcFile) => {
    const isYaml =
      file.type === 'application/x-yaml' ||
      file.type === 'text/yaml' ||
      file.name.endsWith('.yaml') ||
      file.name.endsWith('.yml');
    if (!isYaml) {
      message.error('You can only upload YAML file!');
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        onUpload?.(content);
        setContent(content);
      } else {
        message.error('Failed to read file content!');
      }
    };
    reader.readAsText(file);
    // Prevent upload
    return false;
  };

  const renderHeader = () => {
    return (
      <Header>
        <span className="title">{title || 'YAML'}</span>
        <Upload
          name="file"
          multiple={false}
          beforeUpload={beforeUpload}
          showUploadList={false}
          accept=".yaml,.yml,text/yaml,application/x-yaml"
        >
          <Button icon={<ImportOutlined />} type="text" size="small">
            {intl.formatMessage({ id: 'common.button.import' })}
          </Button>
        </Upload>
      </Header>
    );
  };

  useImperativeHandle(ref, () => ({
    format: () => {
      editorRef.current?.format();
    },
    getValue: () => {
      return editorRef.current?.getValue?.();
    },
    setValue: (val: string) => {
      setContent(val);
    },
    dispose: () => {
      editorRef.current?.dispose?.();
    },
    validate() {
      return editorRef.current?.validate();
    },
    editor: editorRef.current
  }));

  useEffect(() => {
    editorRef.current?.format();
  }, [value]);

  return (
    <Container
      className="yaml-editor-container"
      style={{
        minHeight: height
      }}
    >
      <Suspense
        fallback={
          <Loading style={{ height }}>
            <LoadingOutlined style={{ fontSize: 24 }} />
          </Loading>
        }
      >
        <EditorInner
          ref={attachEditor}
          header={renderHeader()}
          variant={variant}
          height={height}
          theme={isDarkTheme ? 'vs-dark' : 'light'}
          value={safeValue}
          placeholder={placeholder}
          schema={schema}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
        />
      </Suspense>
      {validateMessage && (
        <ErrorText type="danger">{validateMessage}</ErrorText>
      )}
    </Container>
  );
});

export default YamlEditor;
