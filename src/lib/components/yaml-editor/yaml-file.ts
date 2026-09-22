// What every YAML file picker in the product agrees a document may be, and the
// check that enforces it. Shared rather than restated per picker: the editor's
// own Import button is one caller, but a screen whose editor has no Import
// button of its own — the import drawer, which feeds a diff — has to mount its
// own `Upload`, and a picker that quietly used a looser number would be the one
// that still takes the tab down.

// The ceiling, in bytes. Not a preference but a measurement: the file is read
// whole into a JS string, handed to a monaco model, and synced to the
// monaco-yaml worker, which re-parses all of it for every completion — a 250MB
// import took the browser tab down outright (gpustack/gpustack#6234). Sized
// against the documents these editors actually hold: the largest one GPUStack
// publishes is 257KB, and at 1MB a worker parse costs ~220ms, so this is four
// times the real ceiling and still responsive.
export const MAX_YAML_FILE_SIZE = 1024 * 1024;

const YAML_MIME_TYPES = ['application/x-yaml', 'text/yaml'];

const YAML_EXTENSIONS = '.yaml, .yml';

// Only ever renders a limit, which is a round number of KB or MB by
// construction — enough that this does not need the general-purpose formatter
// in `utils`, whose barrel would pull lodash and tinycolor into the editor's
// own chunk.
const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${Math.round((bytes / 1024 / 1024) * 10) / 10}MB`
    : `${Math.round(bytes / 1024)}KB`;

// Why a file was refused, as a message descriptor rather than a rendered
// string. The pickers surface a refusal differently — a toast from the editor's
// own header, an inline banner in the import drawer — so each formats this
// through its own `intl` and puts it where that screen shows failures.
export interface YamlFileRejection {
  id: string;
  values: Record<string, string>;
}

// Everything a picker needs of the file, so a `File`, an `RcFile` or a plain
// record all satisfy it.
export interface YamlFileCandidate {
  name: string;
  type: string;
  size: number;
}

/**
 * Why this file cannot be opened, or `null` when it can.
 *
 * Call it *before* reading the file: reading is already the expensive half, so
 * a file that will not be accepted must never reach `readAsText` /
 * `File.text()`. `accept` on the input is a filter, not a guarantee — a
 * drag-and-drop arrives whatever its name says.
 */
export const checkYamlFile = (
  file: YamlFileCandidate,
  maxSize: number = MAX_YAML_FILE_SIZE
): YamlFileRejection | null => {
  const isYaml =
    YAML_MIME_TYPES.includes(file.type) ||
    file.name.endsWith('.yaml') ||
    file.name.endsWith('.yml');
  if (!isYaml) {
    return {
      id: 'common.file.format.limit',
      values: { formats: YAML_EXTENSIONS }
    };
  }
  if (file.size > maxSize) {
    return {
      id: 'common.file.size.limit',
      values: { size: formatSize(maxSize) }
    };
  }
  return null;
};
