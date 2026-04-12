import { StreamProcessor } from './stream-processor';

export async function fetchStream(
  url: string,
  handler: (chunk: string, meta?: any) => void,
  signal?: AbortSignal
) {
  const response = await fetch(url, { signal });

  if (!response.body) {
    throw new Error('No stream body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');

  const processor = new StreamProcessor(handler);

  while (true) {
    const { done, value } = await reader.read();

    if (value) {
      const chunk = decoder.decode(value, { stream: true });
      processor.push(chunk);

      // ❗ 非阻塞 flush（关键优化）
      void processor.flush(done);
    }

    if (done) {
      await processor.flush(true);
      break;
    }
  }
}
