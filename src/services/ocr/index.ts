import { TesseractOCRService } from './tesseractService';
import { OpenAIOCRService } from './openAIService';
import type { OCRService } from './types';

const hasOpenAIKey = Boolean(import.meta.env.VITE_OPENAI_API_KEY);
export const ocrService: OCRService = hasOpenAIKey ? new OpenAIOCRService() : new TesseractOCRService();
export * from './types';

