import type { HLJSApi, LanguageFn } from 'highlight.js';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import plaintext from 'highlight.js/lib/languages/plaintext';
import python from 'highlight.js/lib/languages/python';
import shell from 'highlight.js/lib/languages/shell';
import yaml from 'highlight.js/lib/languages/yaml';

// The full `highlight.js` build registers ~190 languages and weighs ~1MB
// unminified. Importing it statically pinned that whole payload into core-ui's
// main entry, so every consumer shipped it — including the routes that never
// render a code block.
//
// Instead we keep a small synchronous set covering every language the app
// hands to `HighlightCode` directly, and fall back to a dynamic import of the
// full build for anything outside it. The set is a fast path, never a
// correctness precondition: markdown fenced blocks can carry any language, so
// it could never be made exhaustive.
//
// Registering aliases is not needed — `registerLanguage` picks up the
// `aliases` each language definition declares (`sh`/`zsh` for bash,
// `text`/`txt` for plaintext, ...).
const COMMON_LANGUAGES: Record<string, LanguageFn> = {
  bash,
  javascript,
  json,
  plaintext,
  python,
  shell,
  yaml
};

let commonRegistered = false;

/**
 * The core build with the common language set registered.
 *
 * Registration is deliberately deferred to first call rather than run at
 * module scope: `registerLanguage` is a side effect, and a side-effectful
 * module body would stop consumers' bundlers from tree-shaking these languages
 * out of apps that never render a code block.
 */
export const getCommonHighlighter = (): HLJSApi => {
  if (!commonRegistered) {
    commonRegistered = true;
    Object.entries(COMMON_LANGUAGES).forEach(([name, language]) => {
      hljs.registerLanguage(name, language);
    });
  }
  return hljs;
};

let fullHighlighter: HLJSApi | null = null;
let fullHighlighterPromise: Promise<HLJSApi> | null = null;

/** The full build, or `null` while it has not been loaded. */
export const getFullHighlighter = (): HLJSApi | null => fullHighlighter;

/** Loads the full build once, shared across every mounted code block. */
export const loadFullHighlighter = (): Promise<HLJSApi> => {
  if (!fullHighlighterPromise) {
    fullHighlighterPromise = import('highlight.js')
      .then((mod) => {
        fullHighlighter = mod.default;
        return mod.default;
      })
      .catch((error) => {
        // Drop the cached rejection so a later mount can retry, rather than
        // one failed fetch locking the whole session into plain text.
        fullHighlighterPromise = null;
        throw error;
      });
  }
  return fullHighlighterPromise;
};

const warnedLanguages = new Set<string>();

/**
 * Warns once per language name.
 *
 * Streaming markdown re-renders on every token, so a fence being typed out
 * (```b -> ```ba -> ```bas -> ```bash) walks through a series of unresolvable
 * prefixes — each one on every frame. Deduping keeps that from flooding the
 * console on a chat page.
 */
export const warnUnknownLanguage = (lang: string): void => {
  if (warnedLanguages.has(lang)) {
    return;
  }
  warnedLanguages.add(lang);
  console.warn(`The language "${lang}" you specified could not be found.`);
};
