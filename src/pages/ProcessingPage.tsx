import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ocrService } from '../services/ocr';
import { patternExtractor } from '../services/extraction/patternExtractor';
import { ruleEngine } from '../services/rules/engine';
import { uploadInspectionImage } from '../services/storage/imageService';
import { useInspectionContext } from '../contexts/InspectionContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button } from '../components/ui/Primitives';
import { CheckCircle2, Loader2, Circle, AlertCircle } from 'lucide-react';
import type { Inspection } from '../types';

interface ProcessingState {
  imageBlob?: Blob;
  productName?: string;
  category?: string;
}

export const ProcessingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addInspection } = useInspectionContext();
  const { user } = useAuth();

  const state = location.state as ProcessingState;
  const imageBlob = state?.imageBlob;
  const productName = state?.productName || 'Package Inspection';
  const category = state?.category || 'Food & Beverages';

  const [step, setStep] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!imageBlob) {
      navigate('/inspection/new', { replace: true });
      return;
    }

    let isMounted = true;

    const runPipeline = async () => {
      try {
        const inspectionId = `INS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const userId = user?.id || '00000000-0000-0000-0000-000000000001';

        // Step 1: Image Received
        if (!isMounted) return;
        setStep(1);

        // Step 2: Preparing image & storage upload
        if (!isMounted) return;
        setStep(2);
        const imageUrl = await uploadInspectionImage(userId, inspectionId, imageBlob);

        // Step 3: Extracting text via OCR (Tesseract.js)
        if (!isMounted) return;
        setStep(3);
        const ocrResult = await ocrService.extractText(imageBlob);

        // Step 4: Identifying declarations (Pattern extraction)
        if (!isMounted) return;
        setStep(4);
        const extractedDeclarations = patternExtractor.extract(ocrResult.fullText);

        // Step 5: Checking compliance rules
        if (!isMounted) return;
        setStep(5);
        const ruleResults = ruleEngine.evaluate(extractedDeclarations, category);

        // Step 6: Preparing result metrics
        if (!isMounted) return;
        setStep(6);

        const totalRules = ruleResults.filter((r) => r.status !== 'not_applicable').length;
        const passedCount = ruleResults.filter((r) => r.status === 'pass').length;
        const failedCount = ruleResults.filter((r) => r.status === 'fail').length;
        const reviewCount = ruleResults.filter((r) => r.status === 'review').length;

        const score = totalRules > 0 ? Math.round((passedCount / totalRules) * 100) : 0;
        const overallResult =
          failedCount > 0 ? 'non_compliant' : reviewCount > 0 ? 'requires_review' : 'compliant';

        const completedInspection: Inspection = {
          id: inspectionId,
          user_id: userId,
          product_name: productName,
          category,
          inspection_date: new Date().toISOString(),
          status: 'completed',
          compliance_score: score,
          overall_result: overallResult,
          image_urls: [imageUrl],
          ocr_raw_text: ocrResult.fullText,
          ocr_confidence: Math.round(ocrResult.confidence),
          extracted_declarations: extractedDeclarations,
          rule_results: ruleResults,
          total_rules_checked: totalRules,
          rules_passed: passedCount,
          rules_failed: failedCount,
          rules_review: reviewCount,
          notes: null,
        };

        await addInspection(completedInspection);

        if (isMounted) {
          navigate(`/inspection/${inspectionId}/result`, { replace: true });
        }
      } catch (err: any) {
        console.error('Inspection Pipeline Error:', err);
        if (isMounted) {
          setErrorMsg(err.message || 'An unexpected error occurred during processing.');
        }
      }
    };

    runPipeline();

    return () => {
      isMounted = false;
    };
  }, []);

  const stepsList = [
    { num: 1, label: 'Image received' },
    { num: 2, label: 'Preparing image & storage upload' },
    { num: 3, label: 'Extracting text (Browser Tesseract OCR)' },
    { num: 4, label: 'Identifying mandatory declarations' },
    { num: 5, label: 'Checking Legal Metrology rules' },
    { num: 6, label: 'Preparing inspection compliance report' },
  ];

  const thumbUrl = imageBlob ? URL.createObjectURL(imageBlob) : null;

  return (
    <div className="max-w-xl mx-auto py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-[#212529]">Inspecting Package</h1>
        <p className="text-sm text-[#495057] mt-1">
          Executing optical character recognition and Legal Metrology rule evaluation.
        </p>
      </div>

      <Card className="p-6 space-y-6">
        {thumbUrl && (
          <div className="flex justify-center">
            <div className="w-24 h-24 border border-[#DEE2E6] rounded-lg overflow-hidden bg-[#F1F3F5] flex items-center justify-center p-1">
              <img src={thumbUrl} alt="Package thumbnail" className="max-h-full max-w-full object-contain" />
            </div>
          </div>
        )}

        {errorMsg ? (
          <div className="p-4 bg-[#FFF5F5] border border-[#FFC9C9] text-[#C92A2A] rounded-lg space-y-3">
            <div className="flex items-center gap-2 font-medium text-sm">
              <AlertCircle size={18} />
              <span>Inspection Processing Failed</span>
            </div>
            <p className="text-xs text-[#495057]">{errorMsg}</p>
            <div className="flex gap-3 pt-2">
              <Button size="sm" onClick={() => navigate('/inspection/new')}>
                Upload Different Image
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {stepsList.map((s) => {
              const isDone = step > s.num;
              const isCurrent = step === s.num;

              return (
                <div key={s.num} className="flex items-center gap-3 text-sm">
                  {isDone ? (
                    <CheckCircle2 className="text-[#2B8A3E] shrink-0" size={20} />
                  ) : isCurrent ? (
                    <Loader2 className="animate-spin text-[#1971C2] shrink-0" size={20} />
                  ) : (
                    <Circle className="text-[#CED4DA] shrink-0" size={20} />
                  )}
                  <span
                    className={
                      isDone
                        ? 'text-[#212529] font-medium'
                        : isCurrent
                        ? 'text-[#1971C2] font-semibold'
                        : 'text-[#868E96]'
                    }
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
