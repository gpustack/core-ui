import { describe, expect, it } from 'vitest';
import {
  TailBuffer,
  clampPage,
  navigationFor,
  pageCount,
  pageRange,
  parsePageInput,
  sessionMode
} from './logs-paging';

describe('log paging', () => {
  it('falls back to streaming when the log route cannot answer ranges', () => {
    // A worker too old to measure the log reports no length, and cannot be
    // asked for page 900 either -- so the viewer keeps today's behaviour.
    expect(sessionMode(null, true)).toBe('legacy');
    expect(sessionMode(null, false)).toBe('legacy');
    expect(sessionMode(1_991_000, true)).toBe('follow');
    expect(sessionMode(1_991_000, false)).toBe('paged');
  });

  it('reads a page from the server unless it is the one being followed', () => {
    expect(navigationFor('follow', 900, 1991, true)).toBe('fetch');
    expect(navigationFor('paged', 1991, 1991, true)).toBe('follow');
    // Nothing to follow: even the last page is a read.
    expect(navigationFor('paged', 1991, 1991, false)).toBe('fetch');
    // Without ranges every page still comes out of what was streamed.
    expect(navigationFor('legacy', 900, 1991, true)).toBe('slice');
  });

  it('counts pages from the log on disk, not from what was loaded', () => {
    // A million-line log is 1000 pages whether or not a single one was
    // fetched -- counting loaded lines is what forces the viewer to read the
    // whole log before it can say how long it is.
    expect(pageCount(1_000_000, 1000)).toBe(1000);
    expect(pageCount(1_000_001, 1000)).toBe(1001);
    expect(pageCount(0, 1000)).toBe(1);
  });

  it('asks for a deep page directly instead of everything before it', () => {
    expect(pageRange(1, 1000)).toEqual({ offset: 0, limit: 1000 });
    expect(pageRange(900, 1000)).toEqual({ offset: 899_000, limit: 1000 });
    // The last page starts where the last whole page ends, however little of
    // it there is.
    expect(pageRange(pageCount(5400, 1000), 1000)).toEqual({
      offset: 5000,
      limit: 1000
    });
  });

  it('refuses a typed page that addresses nothing', () => {
    expect(parsePageInput('900', 1991)).toBe(900);
    expect(parsePageInput(' 900 ', 1991)).toBe(900);
    expect(parsePageInput('1992', 1991)).toBeNull();
    expect(parsePageInput('0', 1991)).toBeNull();
    expect(parsePageInput('1.5', 1991)).toBeNull();
    expect(parsePageInput('', 1991)).toBeNull();
    expect(parsePageInput('last', 1991)).toBeNull();
  });

  it('keeps every entrance to a page on the same page', () => {
    expect(clampPage(0, 10)).toBe(1);
    expect(clampPage(11, 10)).toBe(10);
    expect(clampPage(4, 10)).toBe(4);
  });

  it('stops a followed log growing in memory, a page at a time', () => {
    const buffer = new TailBuffer(2, 10);

    buffer.push(Array.from({ length: 25 }, (_, i) => `line-${i}`));

    // Whole pages leave from the front, so what is left still covers more
    // than the page on screen.
    expect(buffer.lines.length).toBe(15);
    expect(buffer.lines[0]).toBe('line-10');
    expect(buffer.lastLines(5)).toEqual([
      'line-20',
      'line-21',
      'line-22',
      'line-23',
      'line-24'
    ]);

    // A rewritten screen replaces what was held, under the same cap.
    buffer.replace(Array.from({ length: 25 }, (_, i) => `row-${i}`));
    expect(buffer.lines.length).toBe(15);
    expect(buffer.lines[0]).toBe('row-10');
  });

  it('holds a short followed log whole', () => {
    const buffer = new TailBuffer(2, 10);

    buffer.push(['a', 'b', 'c']);

    expect(buffer.lines).toEqual(['a', 'b', 'c']);
    expect(buffer.lastLines(10)).toEqual(['a', 'b', 'c']);
  });
});
