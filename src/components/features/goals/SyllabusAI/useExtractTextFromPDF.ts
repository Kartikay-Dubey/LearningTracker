import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.js?url";

(pdfjsLib as any).GlobalWorkerOptions.workerSrc = workerSrc;

export function useExtractTextFromPDF() {
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractText = async (file: File): Promise<string | null> => {
    setExtracting(true);
    setError(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(" ");
        text += pageText + "\n";
      }
      setExtracting(false);
      return text.trim();
    } catch (err: any) {
      setError("Failed to extract text from PDF.");
      setExtracting(false);
      return null;
    }
  };

  return { extractText, extracting, error };
}