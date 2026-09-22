import { PageSize } from './config';

/**
 * How the viewer gets its lines.
 *
 * `follow` and `paged` both rest on the log route answering line ranges: the
 * page count comes from the log on disk, and a page costs one request however
 * deep it is. `legacy` is what a worker predating ranges leaves us -- one
 * stream carrying the whole log, paged in the browser.
 */
export type ViewerMode = 'legacy' | 'follow' | 'paged';

/**
 * Which mode a session opens in.
 *
 * A range-aware worker reports how long the stream is; one that is not reports
 * nothing, and cannot be asked for page 900 either -- so the viewer keeps
 * streaming the whole log and paging it in the browser, as it does today.
 */
export const sessionMode = (
  totalLines: number | null,
  canFollow: boolean
): ViewerMode => {
  if (totalLines === null) {
    return 'legacy';
  }
  return canFollow ? 'follow' : 'paged';
};

/** What landing on `target` costs: a slice of memory, the stream, or a read. */
export const navigationFor = (
  mode: ViewerMode,
  target: number,
  totalPages: number,
  canFollow: boolean
): 'slice' | 'follow' | 'fetch' => {
  if (mode === 'legacy') {
    return 'slice';
  }
  if (target === totalPages && canFollow) {
    return 'follow';
  }
  return 'fetch';
};

/**
 * Pages are numbered from the start of the log, so one number always names one
 * range of lines, whichever control asked for it.
 */
export const pageCount = (totalLines: number, pageSize: number = PageSize) =>
  Math.max(1, Math.ceil(totalLines / pageSize));

/** The line range page `page` addresses, in the query the log route takes. */
export const pageRange = (page: number, pageSize: number = PageSize) => ({
  offset: (page - 1) * pageSize,
  limit: pageSize
});

export const clampPage = (page: number, totalPages: number) =>
  Math.min(Math.max(Math.trunc(page) || 1, 1), Math.max(totalPages, 1));

/** A page number typed into the jump box, or null when it addresses nothing. */
export const parsePageInput = (
  raw: string,
  totalPages: number
): number | null => {
  const value = Number(raw.trim());
  if (!raw.trim() || !Number.isInteger(value) || value < 1) {
    return null;
  }
  return value > totalPages ? null : value;
};

/**
 * The tail of a followed log, capped at a whole number of pages.
 *
 * A followed log has no end, so holding every line grows the tab until it dies.
 * Lines leave from the front a page at a time, so what remains always covers
 * the page on screen; anything dropped is still a page request away, because
 * the log itself is on the worker's disk.
 */
export class TailBuffer {
  private buffer: string[] = [];
  private readonly maxPages: number;
  private readonly pageSize: number;

  constructor(maxPages: number, pageSize: number = PageSize) {
    this.maxPages = maxPages;
    this.pageSize = pageSize;
  }

  push(lines: string[]) {
    for (const line of lines) {
      this.buffer.push(line);
    }
    this.trim();
  }

  /** Replace everything, for the screen mode where rows get rewritten. */
  replace(lines: string[]) {
    this.buffer = lines.slice();
    this.trim();
  }

  reset() {
    this.buffer = [];
  }

  private trim() {
    const maxLines = this.maxPages * this.pageSize;
    if (this.buffer.length <= maxLines) {
      return;
    }
    const excess = this.buffer.length - maxLines;
    this.buffer.splice(0, Math.ceil(excess / this.pageSize) * this.pageSize);
  }

  /** The newest `count` lines. */
  lastLines(count: number) {
    return count >= this.buffer.length
      ? this.buffer
      : this.buffer.slice(-count);
  }

  get lines() {
    return this.buffer;
  }
}
