export class SpeedMonitor {
  private lastTime = performance.now();
  private lastBytes = 0;

  private history: number[] = [];
  private max = 5;

  update(totalBytes: number) {
    const now = performance.now();
    const diff = (now - this.lastTime) / 1000;

    if (diff < 0.3) return;

    const speed = (totalBytes - this.lastBytes) / diff;

    this.history.push(speed);
    if (this.history.length > this.max) this.history.shift();

    this.lastTime = now;
    this.lastBytes = totalBytes;
  }

  avg() {
    if (!this.history.length) return 0;
    return this.history.reduce((a, b) => a + b, 0) / this.history.length;
  }
}
