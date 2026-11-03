export const controlSeqRegex = /\x1b\[(\d*);?(\d*)?([A-DJKHfm])/g;
export const replaceLineRegex = /\r\n/g;

export const PageSize = 1000;

/**
 * Pages the follow view holds: the page on screen plus the one it is rolling
 * off, so crossing a page boundary never leaves the view half empty. Anything
 * older is a page request away rather than a copy kept in the tab.
 */
export const MaxBufferedPages = 2;

/** How long the stream is, as the log route reports it on a line range. */
export const TotalLinesHeader = 'X-Log-Total-Lines';

/**
 * The least time between two re-measurements of a followed log, in ms.
 *
 * How much history a follow stream replays before the live output is the
 * server's decision, not a function of the tail asked for, so counting what
 * arrives cannot tell the viewer how long the log is -- it has to ask. Output
 * arriving is what makes the answer stale, so that is what triggers asking; a
 * log that has gone quiet costs nothing.
 */
export const MeasureInterval = 10000;

export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  wait: number
): ((this: ThisParameterType<T>, ...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let previous = Date.now();

  return function (this: ThisParameterType<T>, ...args: Parameters<T>): void {
    const now = Date.now();
    const remaining = wait - (now - previous);
    const context = this as ThisParameterType<T>;

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func.apply(context, args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func.apply(context, args);
      }, remaining);
    }
  };
};
