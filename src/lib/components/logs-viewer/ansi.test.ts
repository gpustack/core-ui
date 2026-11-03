import { describe, expect, it } from 'vitest';
import { ansiToSpans } from './ansi';

const ESC = '\x1b';

describe('ansiToSpans', () => {
  it('leaves a line without escapes untouched', () => {
    expect(ansiToSpans('INFO:     Started server process [1]')).toBeNull();
  });

  it('colors the vLLM launcher line and drops the SGR codes', () => {
    const line = [
      `${ESC}[0;36m(APIServer pid=1)${ESC}[0;0m`,
      `${ESC}[32mINFO${ESC}[0m`,
      `${ESC}[90m11-02 13:48:12${ESC}[0m`,
      `${ESC}[90m[launcher.py:195]${ESC}[0m`,
      'Route: /v1/models, Methods: GET'
    ].join(' ');

    expect(ansiToSpans(line)).toEqual([
      { text: '(APIServer pid=1)', color: '#56b6c2' },
      { text: ' ' },
      { text: 'INFO', color: '#98c379' },
      { text: ' ' },
      { text: '11-02 13:48:12', color: '#6b7280' },
      { text: ' ' },
      { text: '[launcher.py:195]', color: '#6b7280' },
      { text: ' Route: /v1/models, Methods: GET' }
    ]);
    expect(line).toContain(ESC);
    expect(
      ansiToSpans(line)!
        .map((span) => span.text)
        .join('')
    ).not.toContain(ESC);
  });

  it('applies bold and then lets a reset clear it', () => {
    expect(ansiToSpans(`${ESC}[1;31mERROR${ESC}[0m done`)).toEqual([
      { text: 'ERROR', bold: true, color: '#e06c75' },
      { text: ' done' }
    ]);
  });

  it('drops non-color control sequences instead of printing them', () => {
    expect(ansiToSpans(`progress${ESC}[2K done`)).toEqual([
      { text: 'progress done' }
    ]);
  });

  it('renders a line that is only a control sequence as empty', () => {
    expect(ansiToSpans(`${ESC}[0m`)).toEqual([{ text: '' }]);
  });

  it('merges text around a bold-off that leaves the style unchanged', () => {
    expect(ansiToSpans(`normal ${ESC}[22mstill normal`)).toEqual([
      { text: 'normal still normal' }
    ]);
    expect(ansiToSpans(`${ESC}[1mBOLD${ESC}[22m normal`)).toEqual([
      { text: 'BOLD', bold: true },
      { text: ' normal' }
    ]);
  });

  it('does not read a 256-color or truecolor payload as SGR', () => {
    expect(ansiToSpans(`${ESC}[38;5;32mhello`)).toEqual([{ text: 'hello' }]);
    expect(ansiToSpans(`${ESC}[38;5;1mhello`)).toEqual([{ text: 'hello' }]);
    expect(ansiToSpans(`${ESC}[38;2;255;0;32mhello`)).toEqual([
      { text: 'hello' }
    ]);
    expect(ansiToSpans(`${ESC}[48;5;31mhello`)).toEqual([{ text: 'hello' }]);
    expect(ansiToSpans(`${ESC}[32;38;5;1mX`)).toEqual([
      { text: 'X', color: '#98c379' }
    ]);
    expect(ansiToSpans(`${ESC}[38;5;32;1mX`)).toEqual([
      { text: 'X', bold: true }
    ]);
  });

  it('drops colon-form extended color parameters without leaking them', () => {
    expect(ansiToSpans(`${ESC}[38:2::255:0:0mERROR`)).toEqual([
      { text: 'ERROR' }
    ]);
  });

  it('drops OSC strings terminated by BEL or ST', () => {
    expect(ansiToSpans(`before${ESC}]0;title\x07after`)).toEqual([
      { text: 'beforeafter' }
    ]);
    expect(ansiToSpans(`before${ESC}]0;title${ESC}\\after`)).toEqual([
      { text: 'beforeafter' }
    ]);
  });

  it('parses repeated unterminated OSC prefixes in linear time', () => {
    const input = `${ESC}]x`.repeat(32_000);
    const startedAt = performance.now();
    const spans = ansiToSpans(input);
    const elapsed = performance.now() - startedAt;

    expect(spans!.map((span) => span.text).join('')).toBe('x'.repeat(32_000));
    // The old expression takes seconds here; leave ample room for slow CI.
    expect(elapsed).toBeLessThan(500);
  });

  it('carries SGR state across lines until a reset', () => {
    const style = {};

    expect(ansiToSpans(`${ESC}[31mERROR`, style)).toEqual([
      { text: 'ERROR', color: '#e06c75' }
    ]);
    expect(ansiToSpans('continued', style)).toEqual([
      { text: 'continued', color: '#e06c75' }
    ]);
    expect(ansiToSpans(`${ESC}[0mdone`, style)).toEqual([{ text: 'done' }]);
    expect(ansiToSpans('plain', style)).toBeNull();
  });
});
