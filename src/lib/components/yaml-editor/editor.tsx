import { LoadingOutlined } from '@ant-design/icons';
import Editor, { DiffEditor, loader } from '@monaco-editor/react';
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

// Past this, a document is shown as it arrived rather than reformatted.
// monaco-yaml formats with prettier, whose YAML printer is superlinear in
// document size — measured on GPUStack's own catalog document: 0.3s at 120KB,
// 0.7s at 280KB, 1.5s at 550KB, 6.3s at 1MB, 53s at 2.4MB. Formatting is a
// courtesy nobody asked for (the content comes from a server or from a file the
// user just picked), so it is not worth a stall of that order, and skipping it
// is what keeps the editor's size ceiling a question of memory rather than of
// this curve.
//
// Placed above every document GPUStack publishes — the largest,
// `community-inference-backends.yaml`, is 257KB — so nothing that arrives here
// today stops being formatted, and below the point where the curve turns.
const AUTO_FORMAT_SIZE_LIMIT = 512 * 1024;

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

// Only clears the entry this editor put there. Two editors sharing a path is
// a caller mistake — see the `path` prop on `YamlEditor` — but it is a silent
// one, and an unconditional delete would compound it: a schema-less editor
// unmounting would strip a still-mounted sibling's schema and leave it
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

  // The size is read off the model rather than the `value` prop: content pushed
  // in imperatively (`setValue`, the Import button) never passes through the
  // prop, and it is exactly the path an oversized document arrives on.
  const formatCode = () => {
    if (editorRef.current) {
      setTimeout(() => {
        const length = editorRef.current?.getModel?.()?.getValueLength?.() ?? 0;
        if (length > AUTO_FORMAT_SIZE_LIMIT) {
          return;
        }
        editorRef.current?.getAction?.('editor.action.formatDocument')?.run();
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

export interface DiffViewerProps {
  // Left-hand side, always read-only: what the value is now.
  original: string;
  // Right-hand side: what it would become, and the only side the user edits.
  modified: string;
  height?: string | number;
  theme?: string;
  header?: React.ReactNode;
  readOnly?: boolean;
  // The edited text, delivered when focus leaves it rather than per
  // keystroke. A caller that re-derives `modified` from what it is told —
  // re-planning it, reformatting it — would otherwise be rewriting the
  // buffer under a cursor that is still in it.
  onBlur?: (value: string) => void;
  // The buffer's new content as it changes. Not a claim that the user typed
  // it: @monaco-editor/react writes an externally changed `modified` into an
  // editable side as an ordinary edit, indistinguishable from typing — into a
  // read-only side it resets the model instead, and that is filtered out. So
  // compare values to decide whether something is dirty, rather than counting
  // events.
  onChange?: (value: string) => void;
}

export interface DiffEditorHandle {
  // The right-hand side as it stands. For a save path that never passes
  // through a blur — a form submitting on Enter, a shortcut, a drawer
  // closing on Esc — this is the only way to read what the user typed.
  getValue: () => string;
}

// Hoisted: `DiffEditor` pushes `options` straight into `updateOptions` on
// every change of identity, and monaco re-validates the whole set and fans it
// out to both inner editors. An inline object would do that on every render
// of whatever is holding this.
const DIFF_OPTIONS = {
  // YAML's structure *is* its indentation, so a key that moved a level down
  // is one of the changes this component exists to show. monaco defaults
  // this to `true`, under which the diff computer compares lines trimmed and
  // renders exactly that move as no change at all.
  ignoreTrimWhitespace: false,
  // Present in both sets, and not only in the read-only one: monaco merges
  // an options update into the current set rather than replacing it, and
  // bails out early when every key it is given already matches. A `readOnly`
  // that appeared only when true could therefore be turned on but never off.
  readOnly: false,
  scrollBeyondLastLine: false,
  // Without this the editor swallows the wheel, and a page or drawer that
  // scrolls behind it stops scrolling wherever the pointer crosses a diff.
  scrollbar: {
    alwaysConsumeMouseWheel: false,
    verticalScrollbarSize: 6,
    horizontalScrollbarSize: 6
  },
  wordWrap: 'on' as const,
  fontSize: 14
};

const READ_ONLY_DIFF_OPTIONS = { ...DIFF_OPTIONS, readOnly: true };

// Two YAML documents side by side, the right one editable.
//
// No `path` prop, deliberately: with none, `@monaco-editor/react` builds an
// anonymous model per side and disposes both with the editor, so any number
// of these can be mounted at once. Naming the models would instead make two
// on one path share a buffer — and the first to unmount would dispose it out
// from under the other. `YamlEditor` needs paths because monaco-yaml keys
// schemas by them; a diff has no schema, so it needs nothing.
const DiffEditorInner = forwardRef<DiffEditorHandle, DiffViewerProps>(
  (
    {
      original,
      modified,
      height = 380,
      theme = 'vs-dark',
      header,
      readOnly = false,
      onBlur,
      onChange
    },
    ref
  ) => {
    const editorRef = useRef<any>(null);

    // Both are read long after mount — on a blur, on a keystroke — so they
    // are reached through refs rather than captured in the mount closure.
    const blurRef = useRef(onBlur);
    const changeRef = useRef(onChange);

    useEffect(() => {
      blurRef.current = onBlur;
      changeRef.current = onChange;
    }, [onBlur, onChange]);

    useImperativeHandle(
      ref,
      () => ({
        // This handle is reachable a moment before `editorRef` is filled:
        // @monaco-editor/react settles its loader before it creates anything,
        // and only then is `onMount` called. Until it is, the buffer holds
        // exactly what was passed in — there has been nothing to type into —
        // so `modified` is an answer rather than a shrug. `YamlDiffEditor`
        // does the same for the longer window before this component exists
        // at all.
        getValue: () => editorRef.current?.getValue?.() ?? modified
      }),
      [modified]
    );

    const handleMount = (editor: any) => {
      const modifiedEditor = editor.getModifiedEditor();
      editorRef.current = modifiedEditor;

      // `DiffEditor` has no `onChange` of its own — only the single-model
      // `Editor` does — so the edited side is listened to directly.
      modifiedEditor.onDidChangeModelContent?.(
        (event: monaco.editor.IModelContentChangedEvent) => {
          // A reset of the whole model, which is how @monaco-editor/react
          // pushes `modified` into a side it considers read-only — there it
          // calls `setValue` unconditionally, without comparing first. Never
          // something the user did: typing and `executeEdits` both leave this
          // flag clear.
          if (event.isFlush) return;
          changeRef.current?.(modifiedEditor.getValue());
        }
      );

      // The editor may be torn down by whatever the blur was — a collapsing
      // panel, a closing drawer — before this runs, and a disposed model has
      // nothing left to read.
      modifiedEditor.onDidBlurEditorText?.(() => {
        if (modifiedEditor.getModel()) {
          blurRef.current?.(modifiedEditor.getValue());
        }
      });
    };

    return (
      <EditorWrap header={header}>
        <DiffEditor
          height={height}
          theme={theme}
          className="monaco-editor"
          language="yaml"
          original={original}
          modified={modified}
          options={readOnly ? READ_ONLY_DIFF_OPTIONS : DIFF_OPTIONS}
          loading={<LoadingOutlined style={{ fontSize: 24 }}></LoadingOutlined>}
          onMount={handleMount}
        />
      </EditorWrap>
    );
  }
);

export { DiffEditorInner };

export default EditorInner;
