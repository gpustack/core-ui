import { describe, expect, it } from 'vitest';
import { AnsiParser } from './parse-worker';

const ESC = '\x1b';

/**
 * Drive a parser in download mode (the path that actually parses ANSI control
 * sequences) chunk-by-chunk and return the last emitted screen (an array of
 * rows). Each `enqueueData` kicks off an async, setTimeout(0)-paced queue, so
 * we await a few macrotasks between/after feeds to let it drain.
 */
async function feedDownloadChunks(chunks: string[]): Promise<string[]> {
  const parser = new AnsiParser();
  parser.setIsDownloading(true);

  let last: string[] = [];
  parser.onMessage = (msg) => {
    if (Array.isArray(msg?.result)) {
      last = msg.result;
    }
  };

  for (const chunk of chunks) {
    parser.enqueueData(chunk);
    await drain();
  }
  await drain();
  return last;
}

async function drain() {
  for (let i = 0; i < 8; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

describe('AnsiParser download-mode chunk boundaries', () => {
  it('parses a control sequence split across two chunks the same as unsplit', async () => {
    // `\x1b[1;1H` homes the cursor; then "XY" overwrites the first two cells.
    const whole = `ABCDE${ESC}[1;1HXY`;
    const expected = await feedDownloadChunks([whole]);

    // Split right in the middle of the control sequence: "...\x1b[1;1" | "HXY".
    const split = await feedDownloadChunks([`ABCDE${ESC}[1;1`, `HXY`]);

    expect(expected[0]).toBe('XYCDE');
    expect(split).toEqual(expected);
  });

  it('does not leak raw ESC bytes into the screen when split mid-sequence', async () => {
    const screen = await feedDownloadChunks([`ABCDE${ESC}[1;1`, `HXY`]);
    const joined = screen.join('\n');
    expect(joined).not.toContain(ESC);
    expect(joined).not.toContain('[1;1');
  });

  it('handles a clear-screen (\\x1b[2J) split across chunks', async () => {
    // Without carry-over, "OLD\x1b[2" + "JNEW" would render literally because
    // neither chunk contains a complete `\x1b[2J`.
    const screen = await feedDownloadChunks([`OLD${ESC}[2`, `JNEW`]);
    expect(screen.join('\n')).toBe('NEW');
  });

  it('handles a sequence split at every possible byte boundary', async () => {
    const whole = `ABCDE${ESC}[1;1HXY`;
    const expected = await feedDownloadChunks([whole]);

    for (let i = 1; i < whole.length; i++) {
      const split = await feedDownloadChunks([
        whole.slice(0, i),
        whole.slice(i)
      ]);
      expect(split, `split at index ${i}`).toEqual(expected);
    }
  });
});
