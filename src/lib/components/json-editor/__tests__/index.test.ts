// @vitest-environment jsdom

import * as monaco from 'monaco-editor';
import { act, createElement as h } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { JsonEditor, type JsonEditorProps } from '../../../../json-editor';
import YamlEditorInner from '../../yaml-editor/editor';

const runtime = vi.hoisted(() => ({
  configured: null as any,
  jsonOptions: {} as any,
  editors: new Map<string, any>(),
  configure: vi.fn(),
  setJsonOptions: vi.fn(),
  setYamlOptions: vi.fn()
}));

vi.mock('@monaco-editor/react', () => ({
  loader: {
    config: (options: any) => {
      runtime.configured = options.monaco;
      runtime.configure(options);
    }
  },
  default: (props: any) => {
    expect(runtime.configured).not.toBeNull();
    runtime.editors.set(props.path, props);
    return h('div', { 'data-editor-path': props.path }, props.value);
  },
  DiffEditor: () => null
}));
vi.mock('monaco-editor', () => ({
  Uri: { parse: (value: string) => ({ toString: () => value }) },
  languages: {
    json: {
      jsonDefaults: {
        get diagnosticsOptions() {
          return runtime.jsonOptions;
        },
        setDiagnosticsOptions: (options: any) => {
          runtime.jsonOptions = options;
          runtime.setJsonOptions(options);
        }
      }
    }
  }
}));
vi.mock('monaco-yaml', () => ({
  yamlDefaults: { setDiagnosticsOptions: runtime.setYamlOptions }
}));
vi.mock('../../editor-wrap', () => ({
  default: ({ children }: any) => children
}));

let root: Root;
let container: HTMLDivElement;
const stateSchema = { type: 'object', required: ['state'] };
const questionsSchema = { type: 'object', required: ['question-1'] };
const foreignSchema = {
  uri: 'https://example.com/existing.schema.json',
  fileMatch: ['existing.json'],
  schema: { type: 'array' }
};

const editor = (path: string) => runtime.editors.get(path);
const render = async (editors: JsonEditorProps[]) => {
  await act(async () => {
    root.render(
      h(
        'div',
        {},
        ...editors.map((props, index) =>
          h(JsonEditor, {
            key: props.path ?? index,
            ...props
          })
        )
      )
    );
    await vi.dynamicImportSettled();
  });
};

beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  runtime.editors.clear();
  runtime.jsonOptions = {
    validate: false,
    allowComments: true,
    enableSchemaRequest: false,
    schemas: [foreignSchema]
  };
  runtime.setJsonOptions.mockClear();
  runtime.setYamlOptions.mockClear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  delete (globalThis as any).IS_REACT_ACT_ENVIRONMENT;
});

describe('JsonEditor shared runtime', () => {
  it('uses the configured local runtime for both editors and preserves input options and callbacks', async () => {
    const onChange = vi.fn();
    await render([
      {
        path: 'state.json',
        value: '{"state":1}',
        schema: stateSchema,
        height: '100%',
        options: { lineNumbers: 'off', folding: false },
        onChange
      },
      {
        path: 'questions.json',
        value: '{"question-1":{}}',
        schema: questionsSchema,
        isDarkTheme: true
      }
    ]);
    expect(runtime.configure).toHaveBeenCalledExactlyOnceWith({ monaco });
    expect(editor('state.json')).toMatchObject({
      language: 'json',
      value: '{"state":1}',
      height: '100%',
      theme: 'vs',
      options: {
        automaticLayout: true,
        scrollBeyondLastLine: false,
        lineNumbers: 'off',
        folding: false,
        minimap: { enabled: false }
      }
    });
    expect(editor('questions.json').theme).toBe('vs-dark');
    const event = { changes: [] };
    editor('state.json').onChange('{"state":2}', event);
    expect(onChange).toHaveBeenCalledExactlyOnceWith('{"state":2}', event);
  });

  it('keeps schemas scoped to each model and preserves schemas owned by other consumers', async () => {
    await render([
      { path: 'state.json', value: '{}', schema: stateSchema },
      { path: 'questions.json', value: '{}', schema: questionsSchema }
    ]);
    expect(runtime.jsonOptions).toMatchObject({
      validate: true,
      allowComments: false,
      enableSchemaRequest: false
    });
    expect(runtime.jsonOptions.schemas).toEqual([
      foreignSchema,
      {
        uri: 'state.json.schema.json',
        fileMatch: ['state.json'],
        schema: stateSchema
      },
      {
        uri: 'questions.json.schema.json',
        fileMatch: ['questions.json'],
        schema: questionsSchema
      }
    ]);
    await render([
      { path: 'questions.json', value: '{}', schema: questionsSchema }
    ]);
    expect(
      runtime.jsonOptions.schemas.map((schema: any) => schema.uri)
    ).toEqual([foreignSchema.uri, 'questions.json.schema.json']);
    await render([]);
    expect(runtime.jsonOptions.schemas).toEqual([foreignSchema]);
  });

  it('does not restart diagnostics or remount the editor when only content or theme changes', async () => {
    await render([{ path: 'state.json', value: '{}', schema: stateSchema }]);
    const element = container.querySelector('[data-editor-path="state.json"]');
    const calls = runtime.setJsonOptions.mock.calls.length;
    await render([
      {
        path: 'state.json',
        value: '{"state":2}',
        schema: stateSchema,
        isDarkTheme: true
      }
    ]);
    expect(container.querySelector('[data-editor-path="state.json"]')).toBe(
      element
    );
    expect(element?.textContent).toBe('{"state":2}');
    expect(runtime.setJsonOptions).toHaveBeenCalledTimes(calls);
    expect(editor('state.json').theme).toBe('vs-dark');
  });

  it('updates an editor schema without removing its sibling or externally added schemas', async () => {
    await render([
      { path: 'state.json', value: '{}', schema: stateSchema },
      { path: 'questions.json', value: '{}', schema: questionsSchema }
    ]);
    const anotherSchema = { ...foreignSchema, uri: 'another.schema.json' };
    runtime.jsonOptions.schemas.push(anotherSchema);
    const replacement = { type: 'string' };
    await render([
      { path: 'state.json', value: '"changed"', schema: replacement },
      { path: 'questions.json', value: '{}', schema: questionsSchema }
    ]);
    const schemas = runtime.jsonOptions.schemas;
    expect(schemas).toContainEqual(anotherSchema);
    expect(
      schemas.find((item: any) => item.uri === 'state.json.schema.json').schema
    ).toBe(replacement);
    expect(
      schemas.find((item: any) => item.uri === 'questions.json.schema.json')
        .schema
    ).toBe(questionsSchema);
  });

  it('creates independent stable model paths when callers omit path and still uses strict JSON', async () => {
    await render([{ value: '{"first":1}' }, { value: '{"second":2}' }]);
    const paths = Array.from(runtime.editors.keys());
    expect(paths).toHaveLength(2);
    expect(paths[0]).not.toBe(paths[1]);
    expect(runtime.jsonOptions.allowComments).toBe(false);
    runtime.editors.clear();
    await render([{ value: '{"first":3}' }, { value: '{"second":4}' }]);
    expect(Array.from(runtime.editors.keys())).toEqual(paths);
  });

  it('keeps YAML diagnostics separate while using the same configured runtime', async () => {
    const yamlSchema = { type: 'object', required: ['yaml'] };
    await act(async () => {
      root.render(
        h(
          'div',
          {},
          h(YamlEditorInner, {
            path: 'config.yaml',
            value: 'yaml: true',
            schema: yamlSchema
          }),
          h(JsonEditor, {
            path: 'state.json',
            value: '{}',
            schema: stateSchema
          })
        )
      );
      await vi.dynamicImportSettled();
    });
    const yamlCalls = runtime.setYamlOptions.mock.calls.length;
    expect(editor('config.yaml').language).toBe('yaml');
    expect(runtime.setYamlOptions.mock.lastCall?.[0].schemas).toEqual([
      {
        uri: 'config.yaml.schema.json',
        fileMatch: ['config.yaml'],
        schema: yamlSchema
      }
    ]);
    await act(async () => {
      root.render(
        h(
          'div',
          {},
          h(YamlEditorInner, {
            path: 'config.yaml',
            value: 'yaml: true',
            schema: yamlSchema
          })
        )
      );
    });
    expect(runtime.jsonOptions.schemas).toEqual([foreignSchema]);
    expect(runtime.setYamlOptions).toHaveBeenCalledTimes(yamlCalls);
    expect(runtime.configure).toHaveBeenCalledTimes(1);
  });
});
