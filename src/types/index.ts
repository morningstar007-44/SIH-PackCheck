export interface UserProfile {
  id: string;
  full_name: string | null;
  role: string;
  organization: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DeclarationField {
  detected: boolean;
  value: string | null;
  confidence: number;
  rawMatch: string | null;
  position: number | null;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export interface ExtractedDeclarations {
  manufacturer: DeclarationField;
  genericName: DeclarationField;
  netQuantity: DeclarationField;
  mrp: DeclarationField;
  manufacturingDate: DeclarationField;
  bestBefore: DeclarationField;
  batchNumber: DeclarationField;
  consumerCare: DeclarationField;
  countryOfOrigin: DeclarationField;
  fssaiLicense: DeclarationField;
  ingredients: DeclarationField;
  allergenInfo: DeclarationField;
}

export interface Rule {
  id: string;
  field: keyof ExtractedDeclarations;
  name: string;
  description: string;
  reference: string;
  checkType: 'presence' | 'format' | 'range' | 'conditional';
  severity: 'high' | 'medium' | 'low';
  applicableTo: string[];
  formatPattern?: string;
  rangeMin?: number;
  rangeMax?: number;
  conditionalField?: string;
  conditionalValue?: string;
  isActive: boolean;
}

export interface RuleResult {
  ruleId: string;
  ruleName: string;
  field: string;
  status: 'pass' | 'fail' | 'review' | 'not_applicable';
  detectedValue: string | null;
  confidence: number;
  message: string;
  severity: 'high' | 'medium' | 'low';
}

export interface Inspection {
  id: string;
  user_id: string;
  product_name: string | null;
  category: string | null;
  inspection_date: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  compliance_score: number | null;
  overall_result: 'compliant' | 'non_compliant' | 'requires_review' | null;
  image_urls: string[];
  ocr_raw_text: string | null;
  ocr_confidence: number | null;
  extracted_declarations: ExtractedDeclarations | null;
  rule_results: RuleResult[] | null;
  total_rules_checked: number;
  rules_passed: number;
  rules_failed: number;
  rules_review: number;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}
