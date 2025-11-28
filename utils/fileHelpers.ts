export const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error("Failed to read file"));
      }
    };

    reader.onerror = () => {
      reject(new Error("File reading error"));
    };

    // For this demo, we treat all inputs as text. 
    // In a real production app, we'd use pdf-parse or mammoth for docx.
    // This simple implementation relies on the browser's ability to read text encoding.
    reader.readAsText(file);
  });
};
