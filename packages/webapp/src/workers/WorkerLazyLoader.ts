

export async function loadWorkerDynamically(): Promise<Worker | null> {
  if (typeof window === 'undefined') {
    console.log('Not in a browser environment');
    // Not in a browser environment
    return null;
  }

  const worker = new Worker(new URL("./zk.worker.ts", import.meta.url), { type: 'module' });

  // Setup message handling, error handling, etc.
  worker.onmessage = (event) => {
    console.log('Message from worker:', event.data);
  };

  worker.onerror = (error) => {
    console.error('Worker error:', error);
  };

  return worker;
}