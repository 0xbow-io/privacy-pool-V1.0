export function isUrlOrFilePath(path: string): 'url' | 'file' | 'unknown' {
    // URL regex pattern
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
  
    // File path patterns
    const absolutePathPattern = /^(?:\/|[a-zA-Z]:\\)/;
    const relativePathPattern = /^\.{1,2}\//;
  
    if (urlPattern.test(path)) {
      return 'url';
    } else if (absolutePathPattern.test(path) || relativePathPattern.test(path)) {
      return 'file';
    } else {
      // If it's neither a clear URL nor a clear file path, you might want to do additional checks
      try {
        new URL(path);
        return 'url';
      } catch {
        // If it's not a valid URL, assume it's a file path
        return 'file';
      }
    }
  }