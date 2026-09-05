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

  private extractManufacturer(text: string, normalized: string): DeclarationField {
    const patterns = [
      /(?:Mfd\.?\s*by|Manufactured\s*by|Packed\s*by|Mfg\.?\s*by|Packer|Manufactured\s*&\s*Packed\s*by|Marketed\s*by|Mfd\s+in\s+India\s+by|Mfg)[:\s]+([A-Za-z0-9\s.,&'()-]{3,80})/i,
      /(?:nestle|nestlé|hindustan\s+unilever|itc|britannia|parle|dabur|marico|haldiram|tata)[:\sA-Za-z0-9.,&'()-]*/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const val = (match[1] || match[0]).split('\n')[0].trim();
        if (val.length > 2) {
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

    if (normalized.includes('nestle') || normalized.includes('nestlé')) {
      return {
        detected: true,
        value: 'Nestlé India Limited',
        confidence: 0.85,
        rawMatch: 'Nestlé',
        position: normalized.indexOf('nestle'),
      };
    }

    return this.emptyField();
  }

  private extractGenericName(text: string, normalized: string): DeclarationField {
    const patterns = [
      /(?:Generic\s*Name|Commodity|Product\s*Name|Item\s*Name|Common\s*Name)[:\s]+([A-Za-z0-9\s-]{3,40})/i,
      /(?:Instant\s*Noodles|Noodles|Biscuits|Soap|Shampoo|Rice|Tea|Spices|Atta|Oil|Mixer|Detergent)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const val = (match[1] || match[0]).split('\n')[0].trim();
        return {
          detected: true,
          value: val,
          confidence: 0.88,
          rawMatch: match[0],
          position: text.indexOf(match[0]),
        };
      }
    }

    if (normalized.includes('maggi') || normalized.includes('noodle')) {
      return {
        detected: true,
        value: 'Instant Noodles',
        confidence: 0.85,
        rawMatch: 'Maggi',
        position: 0,
      };
    }

    return this.emptyField();
  }

  private extractNetQuantity(text: string, normalized: string): DeclarationField {
    const patterns = [
      /(?:Net\s*Qty|Net\s*Quantity|Net\s*Weight|Net\s*Vol|Net\s*Volume|N\.W\.?|Weight|Qty)[:\s]*(\d+(?:\.\d+)?\s*(?:g|gm|gms|kg|ml|l|ltr|litre|liter|units|pcs|n))\b/i,
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

    // Numbers followed by g/ml anywhere in text
    const genericMatch = normalized.match(/(\d+\s*(?:g|ml|kg))/);
    if (genericMatch) {
      return {
        detected: true,
        value: genericMatch[1].toUpperCase(),
        confidence: 0.75,
        rawMatch: genericMatch[0],
        position: normalized.indexOf(genericMatch[0]),
      };
    }

    return this.emptyField();
  }

  private extractMRP(text: string, normalized: string): DeclarationField {
    const patterns = [
      /M\.?R\.?P\.?\s*[:.]?\s*(?:Rs\.?|₹)?\s*(\d+(?:\.\d{2})?)/i,
      /Maximum\s+Retail\s+Price\s*[:.]?\s*(?:Rs\.?|₹)?\s*(\d+(?:\.\d{2})?)/i,
      /(?:Rs\.?|₹)\s*(\d+(?:\.\d{2})?)\s*\(?(?:incl|inclusive)/i,
      /(?:rs|₹)\.?\s*(\d+)/i,
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

    const priceMatch = normalized.match(/(?:mrp|price|rs)\D*(\d+)/);
    if (priceMatch && priceMatch[1]) {
      return {
        detected: true,
        value: `₹${priceMatch[1]}`,
        confidence: 0.75,
        rawMatch: priceMatch[0],
        position: normalized.indexOf(priceMatch[0]),
      };
    }

    return this.emptyField();
  }

  private extractMfgDate(text: string, normalized: string): DeclarationField {
    const patterns = [
      /(?:Mfg\.?\s*Date|Mfd\.?|Date\s*of\s*Mfg|Date\s*of\s*Manufacture|PKD|Packed\s*Date|Packed)[:\s]+([A-Za-z0-9\/\.-]{3,15})/i,
      /(?:mfg|mfd|pkd)\.?\s*[:\s]*(\d{2}[\/\.-]\d{2}[\/\.-]\d{2,4}|\w{3}\s*\d{4}|\d{2}\/\d{2})/i,
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

    const dateMatch = normalized.match(/(\d{2}[\/\.-]\d{2}[\/\.-]\d{2,4})/);
    if (dateMatch) {
      return {
        detected: true,
        value: dateMatch[1],
        confidence: 0.7,
        rawMatch: dateMatch[0],
        position: normalized.indexOf(dateMatch[0]),
      };
    }

    return this.emptyField();
  }

  private extractBestBefore(text: string, normalized: string): DeclarationField {
    const patterns = [
      /(?:Best\s*Before|Use\s*By|Expiry\s*Date|Exp\.?\s*Date)[:\s]+([A-Za-z0-9\s\/\.-]{4,25})/i,
      /(?:Best\s*before\s*\d+\s*(?:months|days|years)\s*(?:from\s*(?:mfg|date|packaging))?)/i,
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

    if (normalized.includes('best before') || normalized.includes('use by')) {
      return {
        detected: true,
        value: 'Best Before Declared',
        confidence: 0.75,
        rawMatch: 'Best Before',
        position: normalized.indexOf('best before'),
      };
    }

    return this.emptyField();
  }

  private extractBatchNumber(text: string, normalized: string): DeclarationField {
    const patterns = [
      /(?:Batch\s*No\.?|Lot\s*No\.?|B\.?\s*No\.?|Batch\s*Code|Lot)[:\s]+([A-Za-z0-9-]{3,20})/i,
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

    const batchMatch = normalized.match(/b\.?no\.?\s*([a-z0-9-]+)/);
    if (batchMatch && batchMatch[1]) {
      return {
        detected: true,
        value: batchMatch[1].toUpperCase(),
        confidence: 0.8,
        rawMatch: batchMatch[0],
        position: normalized.indexOf(batchMatch[0]),
      };
    }

    return this.emptyField();
  }

  private extractConsumerCare(text: string, normalized: string): DeclarationField {
    const patterns = [
      /(?:Consumer\s*Care|Customer\s*Care|Helpline|Toll\s*Free|Contact\s*Us)[:\s]+([A-Za-z0-9\s.,@:-]{8,80})/i,
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

    if (normalized.includes('1800') || normalized.includes('@')) {
      return {
        detected: true,
        value: 'Helpline / Email Detected',
        confidence: 0.75,
        rawMatch: 'Consumer Care',
        position: 0,
      };
    }

    return this.emptyField();
  }

  private extractCountryOfOrigin(text: string, normalized: string): DeclarationField {
    const patterns = [
      /(?:Country\s*of\s*Origin|Made\s*in|Product\s*of)[:\s]+([A-Za-z\s]{3,30})/i,
      /(?:made\s+in\s+india|product\s+of\s+india|india)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return {
          detected: true,
          value: (match[1] || 'India').trim(),
          confidence: 0.92,
          rawMatch: match[0],
          position: text.indexOf(match[0]),
        };
      }
    }

    if (normalized.includes('india')) {
      return {
        detected: true,
        value: 'India',
        confidence: 0.85,
        rawMatch: 'India',
        position: normalized.indexOf('india'),
      };
    }

    return this.emptyField();
  }

  private extractFSSAI(text: string, normalized: string): DeclarationField {
    const patterns = [
      /(?:FSSAI|Lic\.?\s*No\.?|License\s*No\.?)[:\s]*(\d{14})\b/i,
      /\b(\d{14})\b/,
      /fssai\s*[\d\s]{10,20}/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const val = (match[1] || match[0].replace(/\D/g, '')).trim();
        if (val.length >= 10) {
          return {
            detected: true,
            value: val,
            confidence: 0.94,
            rawMatch: match[0],
            position: text.indexOf(match[0]),
          };
        }
      }
    }

    if (normalized.includes('fssai')) {
      return {
        detected: true,
        value: 'FSSAI License Present',
        confidence: 0.8,
        rawMatch: 'fssai',
        position: normalized.indexOf('fssai'),
      };
    }

    return this.emptyField();
  }

  private extractIngredients(text: string, normalized: string): DeclarationField {
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

    if (normalized.includes('ingredients')) {
      return {
        detected: true,
        value: 'Ingredients Declared',
        confidence: 0.75,
        rawMatch: 'ingredients',
        position: normalized.indexOf('ingredients'),
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
