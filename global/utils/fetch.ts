export async function fetchJsonWithRetry<T>(
  url: string,
  retries = 3,
  delay?: number
): Promise<T> {
  let _delay = delay || 1000
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return (await response.json()) as T
    } catch (error) {
      if (i === retries - 1) throw error
      console.warn(`Attempt ${i + 1} failed. Retrying in ${_delay}ms...`)
      await new Promise((resolve) => setTimeout(resolve, _delay))
      // Optionally increase delay for next retry (exponential backoff)
      _delay *= 2
    }
  }
  // This line will never be reached due to the throw in the loop,
  // but TypeScript needs it for type checking
  throw new Error("Unreachable")
}

export async function loadBytesFromUrl(
  url: string,
  retries = 3,
  delay?: number
): Promise<Uint8Array> {
  let _delay = delay || 1000
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const arrayBuffer = await response.arrayBuffer()
      return new Uint8Array(arrayBuffer)
    } catch (error) {
      if (i === retries - 1) throw error
      console.warn(`Attempt ${i + 1} failed. Retrying in ${_delay}ms...`)
      await new Promise((resolve) => setTimeout(resolve, _delay))
      _delay *= 2
    }
  }
  throw new Error("Unreachable")
}
