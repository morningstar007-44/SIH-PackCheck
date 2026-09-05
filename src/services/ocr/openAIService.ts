import type { OCRService, OCRResult } from './types';

export class OpenAIOCRService implements OCRService {
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
  }

  async extractText(image: File | Blob): Promise<OCRResult> {
    if (!this.apiKey) {
      throw new Error('OpenAI API Key is missing. Please check VITE_OPENAI_API_KEY in environment.');
    }

    // Convert Blob/File to base64
    const base64Image = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        resolve(res);
      };
      reader.onerror = reject;
      reader.readAsDataURL(image);
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract ALL readable text from this packaged commodity label accurately. Return ONLY the extracted text, line by line. Include manufacturer details, MRP, Net Quantity, Mfg/Expiry date, Consumer Care details, unit sale price, and country of origin if visible.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: base64Image
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`OpenAI Vision OCR failed: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const extractedText = data.choices?.[0]?.message?.content || '';

    const lines = extractedText.split('\n').filter((line: string) => line.trim().length > 0);

    return {
      fullText: extractedText,
      confidence: 0.95,
      blocks: lines.map((line: string) => ({
        text: line,
        confidence: 0.95
      }))
    };
  }
}
