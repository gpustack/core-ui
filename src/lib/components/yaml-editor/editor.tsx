import { LoadingOutlined } from '@ant-design/icons';
import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { yamlDefaults } from 'monaco-yaml';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef
} from 'react';
import EditorWrap from '../editor-wrap';

loader.config({
  monaco
});

interface ViewerProps {
  ref?: any;
  defaultLang?: string;
  config?: any;
  value: string;
  height?: string | number;
  theme?: string;
  header?: React.ReactNode;
  placeholder?: string;
  variant?: 'bordered' | 'borderless';
  schema?: any;
  // URI of the monaco model backing this editor; see the prop on `YamlEditor`.
  path?: string;
  onChange?: (value: string | undefined, event: any) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

const DEFAULT_PATH = 'inmemory://model/config.yaml';

// monaco-yaml's diagnostics options are global to the monaco instance, so the
// second editor to mount would otherwise replace the first one's schema and
// silently switch off its completions. Keep every mounted editor's schema in
// one registry keyed by model path, and re-register the whole set each time.
const schemaRegistry = new Map<string, any>();

// Reads the module's own `monaco` — the very instance handed to
// `loader.config` above, so it is the one the editor ends up using. Taking it
// from there rather than from a mount callback is what lets the cleanup run
// even for an editor that unmounted before it finished loading.
//
// Returns early when the registry would not actually change: every
// `setDiagnosticsOptions` fires monaco-yaml's `onDidChange`, which calls
// `updateCreateData` → `stopWorker()` and re-registers the marker provider.
// A no-op call therefore tears down the yaml worker that any sibling editor
// is in the middle of using.
const applySchemas = (path: string, schema: any) => {
  // monaco resolves the path through `Uri.parse`, so 'config.yaml' and
  // '/config.yaml' are one model. Keying on the raw string would give them a
  // row each, with colliding `uri`/`fileMatch` — the later one silently
  // shadowing the earlier.
  const key = monaco.Uri.parse(path).toString();

  if (schema) {
    if (schemaRegistry.get(key) === schema) return;
    schemaRegistry.set(key, schema);
  } else if (!schemaRegistry.delete(key)) {
    return;
  }

  yamlDefaults.setDiagnosticsOptions({
    validate: false,
    enableSchemaRequest: true,
    hover: false,
    // A schema's `uri` is its identity, so it has to be as distinct as the
    // model it matches — sharing one would collapse the entries into the last.
    schemas: Array.from(schemaRegistry, ([uri, modelSchema]) => ({
      uri: `${uri}.schema.json`,
      fileMatch: [uri],
      schema: modelSchema
    }))
  });
};

// Only clears the entry this editor put there. Two editors can legitimately
// share a path (one with a schema, one without); an unconditional delete on
// the second one's unmount would strip the first one's schema and leave it
// without completions for the rest of its life.
const releaseSchema = (path: string, schema: any) => {
  if (!schema) return;
  if (schemaRegistry.get(monaco.Uri.parse(path).toString()) !== schema) return;
  applySchemas(path, undefined);
};

const EditorInner: React.FC<ViewerProps> = forwardRef((props, ref) => {
  const {
    value,
    height = 380,
    theme = 'vs-dark',
    header,
    variant = 'borderless',
    schema,
    path = DEFAULT_PATH,
    placeholder,
    onChange,
    onBlur,
    onFocus
  } = props;

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const monacoYamlRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editor.onDidBlurEditorText?.(() => {
      onBlur?.();
    });
    editor.onDidFocusEditorText?.(() => {
      onFocus?.();
    });
  };

  const formatCode = () => {
    if (editorRef.current) {
      setTimeout(() => {
        editorRef.current
          ?.getAction?.('editor.action.formatDocument')
          ?.run()
          .then(() => {
            console.log('format success');
          });
      }, 100);
    }
  };

  // Currently, do not use this function, but keep it for future validation needs
  const getMarkers = () => {
    const uri = editorRef.current?.getModel()?.uri;
    const markers = monacoRef.current?.editor.getModelMarkers({
      resource: uri
    });
    return markers;
  };

  useImperativeHandle(ref, () => ({
    format: () => {
      formatCode();
    },
    getValue: () => {
      return editorRef.current?.getValue?.();
    },
    setValue: (val: string) => {
      editorRef.current?.setValue?.(val);
    },
    dispose: () => {
      editorRef.current?.dispose?.();
      monacoYamlRef.current?.dispose?.();
    },
    validate() {
      return getMarkers();
    },
    editor: editorRef.current
  }));

  useEffect(() => {
    formatCode();
  }, [value]);

  // The only place schemas are registered. Runs before the inner editor gets
  // to build its model — `createEditor` sits behind an effect that waits on
  // `loader.init()`, a promise even when monaco is already cached, so its
  // callback is a microtask that lands after this commit's effects. Keyed on
  // both props, so a `schema` arriving late (an async load) or a changed
  // `path` re-registers instead of leaving monaco-yaml on a stale entry, and
  // the cleanup drops this editor's row so the registry does not grow across
  // a drawer that reopens with a different path.
  useEffect(() => {
    applySchemas(path, schema);
    return () => releaseSchema(path, schema);
  }, [path, schema]);

  return (
    <EditorWrap header={header} variant={variant}>
      <Editor
        path={path}
        defaultPath={path}
        height={height}
        theme={theme}
        className="monaco-editor"
        defaultLanguage={'yaml'}
        language={'yaml'}
        value={value}
        options={{
          minimap: { enabled: false },
          quickSuggestions: true,
          suggestOnTriggerCharacters: true,
          fontSize: 14,
          scrollbar: {
            verticalScrollbarSize: 6,
            horizontalScrollbarSize: 6
          }
        }}
        loading={<LoadingOutlined style={{ fontSize: 24 }}></LoadingOutlined>}
        onMount={handleEditorDidMount}
        onChange={onChange}
      />
    </EditorWrap>
  );
});

export default EditorInner;
