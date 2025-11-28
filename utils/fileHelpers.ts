
import * as JSZipProxy from 'jszip';
import * as pdfjsLibProxy from 'pdfjs-dist/build/pdf';

// Robust import handling for CDN ESM builds where exports might be wrapped in 'default'
// @ts-ignore
const JSZip = (JSZipProxy.default || JSZipProxy) as any;
// @ts-ignore
const pdfjsLib = (pdfjsLibProxy.default || pdfjsLibProxy) as any;

// Initialize PDF.js worker
// pdfjs-dist v3+ usually exports GlobalWorkerOptions
if (pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://aistudiocdn.com/pdfjs-dist@^3.11.174/build/pdf.worker.min.mjs';
}

export const readFileContent = async (file: File): Promise<string> => {
  const extension = file.name.split('.').pop()?.toLowerCase();

  try {
    if (extension === 'docx') {
      return await readDocxFile(file);
    } else if (extension === 'pdf') {
      return await readPdfFile(file);
    } else {
      // Default for txt, md
      return await readTextFile(file);
    }
  } catch (error) {
    console.error("File reading error:", error);
    throw new Error(`Failed to parse ${extension?.toUpperCase()} file. Please check if the file is valid.`);
  }
};

const readTextFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) resolve(event.target.result as string);
      else reject(new Error("Failed to read text file"));
    };
    reader.onerror = () => reject(new Error("Text reading error"));
    reader.readAsText(file);
  });
};

const readDocxFile = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    // JSZip.loadAsync is static in v3
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    // DOCX main content is usually in word/document.xml
    const docXml = await zip.file("word/document.xml")?.async("string");
    
    if (!docXml) throw new Error("Invalid DOCX file - could not find document.xml");

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(docXml, "text/xml");
    
    // Extract text from <w:t> tags
    const paragraphs = xmlDoc.getElementsByTagName("w:p");
    let fullText = "";

    for (let i = 0; i < paragraphs.length; i++) {
      const texts = paragraphs[i].getElementsByTagName("w:t");
      let paraText = "";
      for (let j = 0; j < texts.length; j++) {
        paraText += texts[j].textContent;
      }
      fullText += paraText + "\n";
    }

    return fullText;
  } catch (e) {
    console.error("DOCX Parse Error", e);
    throw new Error("Failed to parse DOCX file");
  }
};

const readPdfFile = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = "";
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n";
    }

    return fullText;
  } catch (e) {
    console.error("PDF Parse Error", e);
    throw new Error("Failed to parse PDF file");
  }
};
