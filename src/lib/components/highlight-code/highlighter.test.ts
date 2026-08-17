import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getCommonHighlighter,
  getFullHighlighter,
  loadFullHighlighter,
  warnUnknownLanguage
} from './highlighter';

// The module caches both the registration flag and the full build, so these
// run in order against one shared instance — mirroring how a real session
// warms up.
describe('highlighter', () => {
  it('starts with no full build loaded', () => {
    expect(getFullHighlighter()).toBeNull();
  });

  it('registers the common set on first use', () => {
    const hljs = getCommonHighlighter();

    for (const lang of [
      'bash',
      'javascript',
      'json',
      'plaintext',
      'python',
      'shell',
      'yaml'
    ]) {
      expect(hljs.getLanguage(lang), lang).toBeDefined();
    }
  });

  it('picks up the aliases each language declares', () => {
    const hljs = getCommonHighlighter();

    expect(hljs.getLanguage('sh')).toBeDefined();
    expect(hljs.getLanguage('zsh')).toBeDefined();
    expect(hljs.getLanguage('js')).toBeDefined();
    expect(hljs.getLanguage('yml')).toBeDefined();
  });

  it('is idempotent and returns the same instance', () => {
    expect(getCommonHighlighter()).toBe(getCommonHighlighter());
  });

  it('highlights a common language synchronously', () => {
    const { value } = getCommonHighlighter().highlight('echo "hi"', {
      language: 'bash',
      ignoreIllegals: true
    });

    expect(value).toContain('hljs-built_in');
  });

  it('leaves languages outside the common set unresolved', () => {
    expect(getCommonHighlighter().getLanguage('rust')).toBeUndefined();
  });

  it('shares a single promise across concurrent loads', () => {
    expect(loadFullHighlighter()).toBe(loadFullHighlighter());
  });

  it('resolves the full build and exposes it synchronously afterwards', async () => {
    const full = await loadFullHighlighter();

    expect(getFullHighlighter()).toBe(full);
    // The language the common set could not resolve above.
    expect(full.getLanguage('rust')).toBeDefined();
  });
});

describe('warnUnknownLanguage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('warns once per language, however many times it is hit', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    for (let i = 0; i < 50; i++) {
      warnUnknownLanguage('not-a-language');
    }

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('not-a-language');
  });

  it('still warns for a language it has not seen before', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // A fence being typed out: every prefix is unresolvable, but each one is
    // only ever reported once no matter how many frames it spans.
    for (const prefix of ['b', 'ba', 'bas']) {
      warnUnknownLanguage(prefix);
      warnUnknownLanguage(prefix);
    }

    expect(warn).toHaveBeenCalledTimes(3);
  });
});
