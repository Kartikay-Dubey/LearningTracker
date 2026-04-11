import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.js?url";
import { createWorker } from "tesseract.js";

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

      let finalStr = text.trim();

      // OCR Fallback if standard extraction fails (e.g. Scanned PDF)
      if (finalStr.length < 50) {
        console.log("Empty text detected. Running OCR Fallback via Tesseract.js...");
        let ocrText = "";
        const maxPages = Math.min(pdf.numPages, 5); 
        
        try {
          const worker = await createWorker('eng');
          for (let i = 1; i <= maxPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            if (context) {
              canvas.height = viewport.height;
              canvas.width = viewport.width;
              await page.render({ canvasContext: context, viewport }).promise;
              
              const result = await worker.recognize(canvas);
              ocrText += result.data.text + " ";
            }
          }
          await worker.terminate();
        } catch (tcrErr) {
          console.error("Tesseract Fallback failed:", tcrErr);
        }
        finalStr = ocrText.trim() || finalStr;
      }

      // Cleanup Noise
      finalStr = finalStr.replace(/\s+/g, ' ');
      
      // Limit to 15000 characters approximately to enforce token control
      if (finalStr.length > 15000) {
        finalStr = finalStr.substring(0, 15000);
      }

      setExtracting(false);
      return finalStr;
    } catch (err: any) {
      console.error("PDF Extraction Error:", err);
      setError("Failed to extract text from PDF.");
      setExtracting(false);
      return null;
    }
  };

  return { extractText, extracting, error };
}