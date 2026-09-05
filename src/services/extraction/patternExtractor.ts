import type { DeclarationField, ExtractedDeclarations } from '../../types';

export class PatternExtractor {
  extract(ocrText: string): ExtractedDeclarations {
    const text = ocrText || '';
    const normalized = text.toLowerCase();

    return {
      manufacturer: this.extractManufacturer(text, normalized),
      genericName: this.extractGenericName(text, normalized),
      netQuantity: this.extractNetQuantity(text, normalized),
      mrp: this.extractMRP(text, normalized),
      manufacturingDate: this.extractMfgDate(text, normalized),
      bestBefore: this.extractBestBefore(text, normalized),
      batchNumber: this.extractBatchNumber(text, normalized),
      consumerCare: this.extractConsumerCare(text, normalized),
      countryOfOrigin: this.extractCountryOfOrigin(text, normalized),
      fssaiLicense: this.extractFSSAI(text, normalized),
      ingredients: this.extractIngredients(text, normalized),
      allergenInfo: this.extractAllergenInfo(text, normalized),
    };
  }

  private emptyField(): DeclarationField {
    return { detected: false, value: null, confidence: 0, rawMatch: null, position: null };
  }

  private extractManufacturer(text: string, _normalized: string): DeclarationField {
    const patterns = [
      /(?:Mfd\.?\s*by|Manufactured\s*by|Packed\s*by|Mfg\.?\s*by|Packer|Manufactured\s*&\s*Packed\s*by)[:\s]+([A-Za-z0-9\s.,&'()-]{5,80})/i,
      /(?:Mfd\s+in\s+India\s+by|Marketed\s+by)[:\s]+([A-Za-z0-9\s.,&'()-]{5,80})/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const val = match[1].split('\n')[0].trim();
        if (val.length > 3) {
          return {
            detected: true,
            value: val,
            confidence: 0.9,
            rawMatch: match[0],
            position: text.indexOf(match[0]),
          };
        }
      }
    }
    return this.emptyField();
  }

  private extractGenericName(text: string, _normalized: string): DeclarationField {
    const patterns = [
      /(?:Generic\s*Name|Commodity|Product\s*Name|Item\s*Name|Common\s*Name)[:\s]+([A-Za-z0-9\s-]{3,40})/i,
      /(?:Biscuits|Soap|Shampoo|Rice|Tea|Spices|Atta|Oil|Noodles|Mixer|Detergent)/i,
    ];

    const match1 = text.match(patterns[0]);
    if (match1 && match1[1]) {
      return {
        detected: true,
        value: match1[1].split('\n')[0].trim(),
        confidence: 0.88,
        rawMatch: match1[0],
        position: text.indexOf(match1[0]),
      };
    }

    const match2 = text.match(patterns[1]);
    if (match2) {
      return {
        detected: true,
        value: match2[0].trim(),
        confidence: 0.75,
        rawMatch: match2[0],
        position: text.indexOf(match2[0]),
      };
    }

    return this.emptyField();
  }

  private extractNetQuantity(text: string, _normalized: string): DeclarationField {
    const patterns = [
      /(?:Net\s*Qty|Net\s*Quantity|Net\s*Weight|Net\s*Vol|Net\s*Volume|N\.W\.?)[:\s]+(\d+(?:\.\d+)?\s*(?:g|gm|gms|kg|ml|l|ltr|litre|liter|units|pcs|n))\b/i,
      /(\b\d+(?:\.\d+)?\s*(?:g|gm|gms|kg|ml|l|ltr|litre|liter)\b)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const valueStr = match[1] || match[0];
        return {
          detected: true,
          value: valueStr.trim(),
          confidence: 0.92,
          rawMatch: match[0],
          position: text.indexOf(match[0]),
        };
      }
    }

    return this.emptyField();
  }

  private extractMRP(text: string, _normalized: string): DeclarationField {
    const patterns = [
      /M\.?R\.?P\.?\s*[:.]?\s*(?:Rs\.?|₹)?\s*(\d+(?:\.\d{2})?)/i,
      /Maximum\s+Retail\s+Price\s*[:.]?\s*(?:Rs\.?|₹)?\s*(\d+(?:\.\d{2})?)/i,
      /(?:Rs\.?|₹)\s*(\d+(?:\.\d{2})?)\s*\(?(?:incl|inclusive)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return {
          detected: true,
          value: `₹${match[1]}`,
          confidence: 0.95,
          rawMatch: match[0],
          position: text.indexOf(match[0]),
        };
      }
    }

    return this.emptyField();
  }

  private extractMfgDate(text: string, _normalized: string): DeclarationField {
    const patterns = [
      /(?:Mfg\.?\s*Date|Mfd\.?|Date\s*of\s*Mfg|Date\s*of\s*Manufacture|PKD|Packed\s*Date)[:\s]+([A-Za-z0-9\/\.-]{5,15})/i,
      /(?:mfg|mfd|pkd)\.?\s*[:\s]*(\d{2}[\/\.-]\d{2}[\/\.-]\d{2,4}|\w{3}\s*\d{4})/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return {
          detected: true,
          value: match[1].trim(),
          confidence: 0.88,
          rawMatch: match[0],
          position: text.indexOf(match[0]),
        };
      }
    }

    return this.emptyField();
  }

  private extractBestBefore(text: string, _normalized: string): DeclarationField {
    const patterns = [
      /(?:Best\s*Before|Use\s*By|Expiry\s*Date|Exp\.?\s*Date)[:\s]+([A-Za-z0-9\s\/\.-]{4,25})/i,
      /(?:Best\s*before\s*\d+\s*(?:months|days|years)\s*from\s*(?:mfg|date|packaging))/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return {
          detected: true,
          value: (match[1] || match[0]).trim(),
          confidence: 0.86,
          rawMatch: match[0],
          position: text.indexOf(match[0]),
        };
      }
    }

    return this.emptyField();
  }

  private extractBatchNumber(text: string, _normalized: string): DeclarationField {
    const patterns = [
      /(?:Batch\s*No\.?|Lot\s*No\.?|B\.?\s*No\.?|Batch\s*Code)[:\s]+([A-Za-z0-9-]{3,20})/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return {
          detected: true,
          value: match[1].trim(),
          confidence: 0.9,
          rawMatch: match[0],
          position: text.indexOf(match[0]),
        };
      }
    }

    return this.emptyField();
  }

  private extractConsumerCare(text: string, _normalized: string): DeclarationField {
    const patterns = [
      /(?:Consumer\s*Care|Customer\s*Care|Helpline|Toll\s*Free|Contact\s*Us)[:\s]+([A-Za-z0-9\s.,@:-]{10,80})/i,
      /(?:1800[-\s]?\d{3}[-\s]?\d{4}|\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return {
          detected: true,
          value: (match[1] || match[0]).trim(),
          confidence: 0.85,
          rawMatch: match[0],
          position: text.indexOf(match[0]),
        };
      }
    }

    return this.emptyField();
  }

  private extractCountryOfOrigin(text: string, _normalized: string): DeclarationField {
    const patterns = [
      /(?:Country\s*of\s*Origin|Made\s*in|Product\s*of)[:\s]+([A-Za-z\s]{3,30})/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return {
          detected: true,
          value: match[1].trim(),
          confidence: 0.92,
          rawMatch: match[0],
          position: text.indexOf(match[0]),
        };
      }
    }

    return this.emptyField();
  }

  private extractFSSAI(text: string, _normalized: string): DeclarationField {
    const patterns = [
      /(?:FSSAI|Lic\.?\s*No\.?|License\s*No\.?)[:\s]*(\d{14})\b/i,
      /\b(\d{14})\b/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return {
          detected: true,
          value: match[1].trim(),
          confidence: 0.94,
          rawMatch: match[0],
          position: text.indexOf(match[0]),
        };
      }
    }

    return this.emptyField();
  }

  private extractIngredients(text: string, _normalized: string): DeclarationField {
    const pattern = /(?:Ingredients)[:\s]+([A-Za-z0-9\s.,()%'-]{10,150})/i;
    const match = text.match(pattern);
    if (match && match[1]) {
      return {
        detected: true,
        value: match[1].split('\n')[0].trim(),
        confidence: 0.85,
        rawMatch: match[0],
        position: text.indexOf(match[0]),
      };
    }
    return this.emptyField();
  }

  private extractAllergenInfo(text: string, _normalized: string): DeclarationField {
    const pattern = /(?:Contains|Allergen\s*Info|May\s*contain)[:\s]+([A-Za-z0-9\s.,'-]{5,60})/i;
    const match = text.match(pattern);
    if (match && match[1]) {
      return {
        detected: true,
        value: match[1].split('\n')[0].trim(),
        confidence: 0.82,
        rawMatch: match[0],
        position: text.indexOf(match[0]),
      };
    }
    return this.emptyField();
  }
}

export const patternExtractor = new PatternExtractor();
