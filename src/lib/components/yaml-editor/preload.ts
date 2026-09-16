// Start fetching monaco before an editor is mounted.
//
// `YamlEditor` and `YamlDiffEditor` both keep monaco behind a lazy boundary,
// which is right — it is ~2.5MB parsed and most sessions never open one — but
// it means whoever mounts the first editor waits out the whole download.
// Every editor in a session shares that one chunk, so the wait is paid once
// and only by the first; the only thing that shortens it is starting sooner.
//
// Call it as soon as an editor becomes plausible rather than certain: a
// drawer opening, a tab becoming reachable. The module loader settles repeat
// calls, so callers need not coordinate or track whether it already ran.
//
// Do NOT call it on app startup. `./editor` configures the monaco loader as a
// module side effect, so a preload on boot pulls those 2.5MB into the initial
// load and gives up the lazy boundary this is meant to soften — it only ever
// moves the wait, never removes it.
//
// Failure is swallowed on purpose. The fetch is speculative and costs nothing
// when it fails: the `lazy()` boundary requests the module again when an
// editor actually mounts, and renders its own error if that fails too. Left
// rejecting, a stale `index.html` asking for a chunk hash a release has
// already replaced would land in `window.onunhandledrejection` — a dev
// overlay, error-reporting noise in production — over nothing.
export const preloadYamlEditor = (): Promise<void> =>
  import('./editor').then(
    () => undefined,
    () => undefined
  );
