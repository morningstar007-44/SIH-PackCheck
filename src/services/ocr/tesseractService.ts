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

  async extractText(image: File | Blob): Promise<OCRResult> {
    try {
      const worker = await this.getWorker();
      const result = await worker.recognize(image);

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
      throw new Error(
        'Text extraction failed. Please ensure the image is clear and well-lit.'
      );
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
