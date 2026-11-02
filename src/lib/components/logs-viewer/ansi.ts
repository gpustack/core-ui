export interface AnsiSpan {
  text: string;
  bold?: boolean;
  color?: string;
}

interface AnsiStyle {
  bold?: boolean;
  color?: string;
}

// The log pane is a dark surface (`--color-logs-bg`). ANSI black (30) is
// lifted off pure black so a "black" span stays readable there.
const PALETTE: Record<number, string> = {
  30: '#5c6370',
  31: '#e06c75',
  32: '#98c379',
  33: '#e5c07b',
  34: '#61afef',
  35: '#c678dd',
  36: '#56b6c2',
  37: '#abb2bf',
  90: '#6b7280',
  91: '#ff7b72',
  92: '#7ee787',
  93: '#e3b341',
  94: '#79c0ff',
  95: '#d2a8ff',
  96: '#56d4dd',
  97: '#ffffff'
};

// SGR (`m`) first, then other CSI, OSC ended by BEL or ST, then a stray ESC.
const SGR = /\x1b\[([\d;]*)m/;
const CSI = /\x1b\[[\d;?]*[ -/]*[@-~]/;
const OSC = /\x1b\][\s\S]*?(?:\x07|\x1b\\)/;
const STRAY = /\x1b[@-_]/;
const CONTROL = new RegExp(
  [SGR.source, CSI.source, OSC.source, STRAY.source].join('|'),
  'g'
);

function applySgr(spec: string, style: AnsiStyle): AnsiStyle {
  const codes =
    spec.length === 0 ? [0] : spec.split(';').map((part) => Number(part) || 0);
  let next = style;
  for (let i = 0; i < codes.length; i++) {
    const code = codes[i];
    // 38/48 open a color payload. The following numbers are that color,
    // so 38;5;1 must not be read as bold.
    if (code === 38 || code === 48) {
      const mode = codes[i + 1];
      if (mode === 5) {
        i += 2;
      } else if (mode === 2) {
        i += 4;
      }
      continue;
    }
    if (code === 0) {
      next = {};
    } else if (code === 1) {
      next = { ...next, bold: true };
    } else if (code === 22) {
      // undefined, not false: push merges on ===, and a span only records bold
      // when it is true.
      next = { ...next, bold: undefined };
    } else if (code === 39) {
      next = { ...next, color: undefined };
    } else if (PALETTE[code]) {
      next = { ...next, color: PALETTE[code] };
    }
  }
  return next;
}

/**
 * Split one log line into styled spans.
 *
 * Returns null when the line has no ESC, so the viewer can render it as text.
 * Every consumed control sequence is dropped; only SGR color and bold change
 * the spans that follow.
 */
export function ansiToSpans(input: string): AnsiSpan[] | null {
  if (!input.includes('\x1b')) {
    return null;
  }

  const spans: AnsiSpan[] = [];
  let style: AnsiStyle = {};
  let last = 0;
  CONTROL.lastIndex = 0;

  const push = (text: string) => {
    if (!text) {
      return;
    }
    const prev = spans[spans.length - 1];
    if (prev && prev.color === style.color && prev.bold === style.bold) {
      prev.text += text;
      return;
    }
    const span: AnsiSpan = { text };
    if (style.color) {
      span.color = style.color;
    }
    if (style.bold) {
      span.bold = true;
    }
    spans.push(span);
  };

  let match: RegExpExecArray | null;
  while ((match = CONTROL.exec(input)) !== null) {
    push(input.slice(last, match.index));
    if (match[1] !== undefined) {
      style = applySgr(match[1], style);
    }
    last = CONTROL.lastIndex;
  }
  push(input.slice(last));

  return spans.length > 0 ? spans : [{ text: '' }];
}
