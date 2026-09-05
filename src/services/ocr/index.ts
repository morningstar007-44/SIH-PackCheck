import { TesseractOCRService } from './tesseractService';
import type { OCRService } from './types';

export const ocrService: OCRService = new TesseractOCRService();
export * from './types';
