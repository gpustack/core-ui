const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

/**
 * Escape a value before interpolating it into a raw HTML string.
 *
 * ECharts `formatter` callbacks return HTML that ECharts injects through an
 * `innerHTML` sink, so every interpolated value has to be escaped. Series
 * names, axis values and data point labels routinely come from the API (model
 * names, route names, cluster names, user input), which makes them
 * attacker-controlled.
 */
export const escapeHtml = (value: unknown): string =>
  String(value ?? '').replace(/[&<>"']/g, (c) => HTML_ESCAPES[c] ?? c);
