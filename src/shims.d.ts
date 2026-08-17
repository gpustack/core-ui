declare module '*.css';
declare module '*.scss';
declare module '*.module.less' {
  const classes: { [key: string]: string };
  export default classes;
}
declare module '*.svg' {
  const content: string;
  export default content;
}
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.md';
declare module 'tinycolor2';
declare module '@orcid/bibtex-parse-js';

// highlight.js ships no per-language declarations — `lib/languages/*` resolves
// to plain JS. Each module default-exports a `LanguageFn`.
declare module 'highlight.js/lib/languages/*' {
  const language: import('highlight.js').LanguageFn;
  export default language;
}
