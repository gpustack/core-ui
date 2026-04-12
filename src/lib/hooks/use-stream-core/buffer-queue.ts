export class BufferQueue<T = any> {
  private queue: T[] = [];
  private batchSize = 10;

  push(item: T) {
    this.queue.push(item);
  }

  drain(): T[] {
    return this.queue.splice(0, this.batchSize);
  }

  size() {
    return this.queue.length;
  }

  clear() {
    this.queue = [];
  }
}
