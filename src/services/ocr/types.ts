export interface OCRService {
  extractText(image: File | Blob): Promise<OCRResult>;
}

export interface OCRResult {
  fullText: string;
  confidence: number;
  blocks: Array<{
    text: string;
    confidence: number;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
}
