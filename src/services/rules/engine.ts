import type { ExtractedDeclarations, Rule, RuleResult } from '../../types';
import { DEFAULT_RULES } from './defaultRules';

export class RuleEngine {
  private rules: Rule[];

  constructor(customRules?: Rule[]) {
    this.rules = customRules || DEFAULT_RULES;
  }

  evaluate(declarations: ExtractedDeclarations, category?: string | null): RuleResult[] {
    const selectedCategory = (category || 'all').toLowerCase();

    return this.rules
      .filter((rule) => rule.isActive)
      .map((rule) => this.evaluateRule(rule, declarations, selectedCategory));
  }

  private evaluateRule(rule: Rule, declarations: ExtractedDeclarations, category: string): RuleResult {
    const isApplicable =
      rule.applicableTo.includes('all') ||
      rule.applicableTo.some((cat) => cat.toLowerCase() === category);

    if (!isApplicable) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        field: rule.field,
        status: 'not_applicable',
        detectedValue: null,
        confidence: 0,
        message: 'Rule not applicable to this product category.',
        severity: rule.severity,
      };
    }

    const fieldData = declarations[rule.field];

    if (!fieldData || !fieldData.detected || !fieldData.value) {
      if (fieldData && fieldData.confidence > 0.3) {
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          field: rule.field,
          status: 'review',
          detectedValue: fieldData.value,
          confidence: fieldData.confidence,
          message: 'Value detected with low confidence. Manual verification recommended.',
          severity: rule.severity,
        };
      }
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        field: rule.field,
        status: 'fail',
        detectedValue: null,
        confidence: 0,
        message: `${rule.name} was not detected on the package.`,
        severity: rule.severity,
      };
    }

    if (fieldData.confidence < 0.7) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        field: rule.field,
        status: 'review',
        detectedValue: fieldData.value,
        confidence: fieldData.confidence,
        message: 'Value detected but confidence is low. Manual verification recommended.',
        severity: rule.severity,
      };
    }

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      field: rule.field,
      status: 'pass',
      detectedValue: fieldData.value,
      confidence: fieldData.confidence,
      message: `${rule.name} detected and verified.`,
      severity: rule.severity,
    };
  }
}

export const ruleEngine = new RuleEngine();
