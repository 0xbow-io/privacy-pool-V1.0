export async function fetchJsonWithRetry<T>(
    url: string, 
    retries: number = 3, 
    delay: number = 1000
  ): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json() as T;
      } catch (error) {
        if (i === retries - 1) throw error;
        console.warn(`Attempt ${i + 1} failed. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        // Optionally increase delay for next retry (exponential backoff)
        delay *= 2;
      }
    }
    // This line will never be reached due to the throw in the loop,
    // but TypeScript needs it for type checking
    throw new Error('Unreachable');
  }
  


  export async function loadBytesFromUrl(
    url: string, 
    retries: number = 3, 
    delay: number = 1000
  ):  Promise<Uint8Array> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        return new Uint8Array(arrayBuffer);
      } catch (error) {
        if (i === retries - 1) throw error;
        console.warn(`Attempt ${i + 1} failed. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
    throw new Error('Unreachable');
  }

