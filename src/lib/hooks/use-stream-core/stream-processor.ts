import { BufferQueue } from './buffer-queue';
import { SpeedMonitor } from './speed-monitor';

export interface StreamMeta {
  isComplete?: boolean;
  progress?: number;
  speed?: number;
}

type Handler = (data: string, meta?: StreamMeta) => void;

export class StreamProcessor {
  private buffer = new BufferQueue<string>();
  private speed = new SpeedMonitor();
  private encoder = new TextEncoder();

  private totalBytes = 0;
  private flushing = false;

  constructor(private handler: Handler) {}

  push(chunk: string) {
    this.buffer.push(chunk);

    const bytes = this.encoder.encode(chunk).length;
    this.totalBytes += bytes;

    this.speed.update(this.totalBytes);
  }

  async flush(done = false) {
    if (this.flushing) return;
    this.flushing = true;

    try {
      const batch = this.buffer.drain();

      for (let i = 0; i < batch.length; i++) {
        const item = batch[i];

        this.handler(item, {
          isComplete: done && this.buffer.size() === 0,
          progress: this.totalBytes,
          speed: this.speed.avg()
        });
      }
    } finally {
      this.flushing = false;
    }
  }
}
