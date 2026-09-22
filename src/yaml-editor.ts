export { default as YamlEditor } from './lib/components/yaml-editor';
export { default as YamlDiffEditor } from './lib/components/yaml-editor/diff';
export type {
  YamlDiffEditorHandle,
  YamlDiffEditorProps
} from './lib/components/yaml-editor/diff';
export { preloadYamlEditor } from './lib/components/yaml-editor/preload';
// For a screen that mounts its own file picker because the editor it feeds has
// none — `YamlDiffEditor` — so its refusals match the Import button's.
export {
  MAX_YAML_FILE_SIZE,
  checkYamlFile
} from './lib/components/yaml-editor/yaml-file';
export type {
  YamlFileCandidate,
  YamlFileRejection
} from './lib/components/yaml-editor/yaml-file';
