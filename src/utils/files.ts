
export function downloadJSON(jsonString: string, filename: string = 'data.json') {
    try {
      // Create a Blob from the JSON string
      const blob = new Blob([jsonString], { type: 'application/json' });
  
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
  
  
      // Create an anchor element and set its href to the blob URL
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
  
      // Append the anchor to the document, trigger a click on it, and then remove it
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  
      // Clean up by revoking the blob URL
      URL.revokeObjectURL(url);
    } catch (err) {
        throw new Error('Failed to download JSON file');
    }
  }