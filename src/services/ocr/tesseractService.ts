import { createWorker } from 'tesseract.js';
import type { OCRService, OCRResult } from './types';

export class TesseractOCRService implements OCRService {
  private workerPromise: Promise<Tesseract.Worker> | null = null;

  private async getWorker(): Promise<Tesseract.Worker> {
    if (!this.workerPromise) {
      this.workerPromise = createWorker('eng');
    }
    return this.workerPromise;
  }

  private async preprocessImage(image: File | Blob): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(image);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          resolve(url);
          return;
        }

        // Upscale image if small to enhance OCR resolution
        const scale = Math.max(1, 1500 / Math.max(img.width, img.height));
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Apply contrast and binarization/grayscale filter
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          // Grayscale formula
          const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          // High contrast boost
          const contrast = 1.2;
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
          const color = Math.min(255, Math.max(0, factor * (avg - 128) + 128));

          data[i] = color;
          data[i + 1] = color;
          data[i + 2] = color;
        }
        ctx.putImageData(imageData, 0, 0);

        const processedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
        URL.revokeObjectURL(url);
        resolve(processedDataUrl);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(url);
      };
      img.src = url;
    });
  }

  async extractText(image: File | Blob): Promise<OCRResult> {
    try {
      const processedImage = await this.preprocessImage(image);
      const worker = await this.getWorker();
      const result = await worker.recognize(processedImage);

      const blocks = ((result.data as any).words || []).map((word: any) => ({
        text: word.text,
        confidence: word.confidence,
        boundingBox: word.bbox
          ? {
              x: word.bbox.x0,
              y: word.bbox.y0,
              width: word.bbox.x1 - word.bbox.x0,
              height: word.bbox.y1 - word.bbox.y0,
            }
          : undefined,
      }));

      return {
        fullText: result.data.text || '',
        confidence: result.data.confidence || 0,
        blocks,
      };
    } catch (error) {
      console.error('Tesseract OCR Error:', error);
      // Clean fallback if canvas or tesseract encounters non-fatal error
      return {
        fullText: '',
        confidence: 0,
        blocks: [],
      };
    }
  }

  async terminate(): Promise<void> {
    if (this.workerPromise) {
      const worker = await this.workerPromise;
      await worker.terminate();
      this.workerPromise = null;
    }
  }
}
