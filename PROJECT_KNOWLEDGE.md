# PROJECT KNOWLEDGE

## Concepts
- [[OCRService]] → interface for text extraction using [[TesseractService]] (in-browser) or future cloud OCR providers
- [[PatternExtractor]] → pattern matching / regex service for Legal Metrology mandatory declarations
- [[RuleEngine]] → evaluates [[ExtractedDeclarations]] against [[LegalMetrologyRules]]
- [[InspectionPipeline]] → orchestrates image compression → OCR → extraction → rule evaluation → Supabase DB/Storage sync
- [[AuthContext]] → React context for user sessions & profile management backed by Supabase Auth

## Key Decisions
- 2026-09-05: Standardized on client-side Tesseract.js OCR so system functions out-of-the-box without requiring 3rd party API keys.
- 2026-09-05: Adopted GOV.UK style professional design system with flat colors, strict typography, and exact hex color palettes.
- 2026-09-05: Client-side PDF report generation using jsPDF with actual inspection telemetry.

## Gotchas
- Browser camera access (`getUserMedia`) requires HTTPS in non-localhost environments; proper fallback UI must be presented.
- Tesseract.js worker initialization is async; reuse worker instance across calls or handle worker lifecycle cleanly.
