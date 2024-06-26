export function isUrlOrFilePath(path: string): "url" | "file" | "unknown" {
  // URL regex pattern
  const urlPattern =
    /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/

  // File path patterns
  const absolutePathPattern = /^(?:\/|[a-zA-Z]:\\)/
  const relativePathPattern = /^\.{1,2}\//

  return urlPattern.test(path)
    ? "url"
    : absolutePathPattern.test(path) || relativePathPattern.test(path)
      ? "file"
      : "unknown"
}
