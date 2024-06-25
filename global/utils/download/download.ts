import { createWriteStream, existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'

async function fetchRetry(urls: string[]): Promise<ReturnType<typeof fetch>> {
  const [url] = urls
  if (!url) throw new Error('No urls to try')
  return fetch(url).catch(() => fetchRetry(urls.slice(1)))
}

export async function download(urls: string[] | string, outputPath: string) {
  const { body, ok, statusText, url } = Array.isArray(urls)
    ? await fetchRetry(urls as string[])
    : await fetch(urls as string)
  if (!ok)
    throw new Error(`Failed to fetch ${url}: ${statusText}`)
  if (!body) throw new Error('Failed to get response body')

  const dir = dirname(outputPath)
  await mkdir(dir, { recursive: true })

  const fileStream = createWriteStream(outputPath)
  const reader = body.getReader()

  try {
    const pump = async () => {
      const { done, value } = await reader.read()
      if (done) {
        fileStream.end()
        return
      }

      fileStream.write(Buffer.from(value))
      await pump()
    }

    await pump()
  } catch (error) {
    fileStream.close()
    throw error
  }
}

export async function maybeDownload(urls: string[] | string, outputPath: string) {
  if (!existsSync(outputPath)) await download(urls, outputPath)
  return outputPath
}