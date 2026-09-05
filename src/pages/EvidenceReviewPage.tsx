import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInspectionContext } from '../contexts/InspectionContext';
import { Button, Card, Badge } from '../components/ui/Primitives';
import { ArrowLeft, FileText } from 'lucide-react';
import type { RuleResult } from '../types';

export const EvidenceReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getInspectionById } = useInspectionContext();

  const inspection = id ? getInspectionById(id) : undefined;
  const [selectedRuleId, setSelectedRuleId] = useState<string>('LM-PC-001');

  if (!inspection) {
    return (
      <div className="max-w-xl mx-auto text-center py-12 space-y-4">
        <h2 className="text-xl font-semibold text-[#212529]">Inspection record not found</h2>
        <Button onClick={() => navigate('/overview')}>Return to Overview</Button>
      </div>
    );
  }

  const rules = inspection.rule_results || [];
  const selectedRule: RuleResult | undefined =
    rules.find((r) => r.ruleId === selectedRuleId) || rules[0];

  const imageUrl = inspection.image_urls?.[0] || 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&auto=format&fit=crop&q=80';

  return (
    <div className="space-y-6">
      {/* Header Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E9ECEF]">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/inspection/${inspection.id}/result`)}
            icon={<ArrowLeft size={16} />}
          >
            Back to Result
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-[#212529]">Evidence Review</h1>
            <p className="text-xs text-[#868E96]">
              Inspection ID: {inspection.id} • {inspection.product_name}
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          onClick={() => navigate(`/inspection/${inspection.id}/report`)}
          icon={<FileText size={16} />}
        >
          Generate Report
        </Button>
      </div>

      {/* Two-Column Desktop Layout per Screen 8 Specification */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Viewer Panel */}
        <div className="lg:col-span-7 space-y-3">
          <Card className="p-3 bg-white border border-[#E9ECEF] flex items-center justify-center min-h-[400px]">
            <div className="relative max-h-[500px] w-full flex items-center justify-center bg-[#F8F9FA] rounded-lg overflow-hidden border border-[#DEE2E6] p-2">
              <img
                src={imageUrl}
                alt="Package Label Evidence"
                className="max-h-[460px] w-auto object-contain"
              />
            </div>
          </Card>
        </div>

        {/* Right Column: Declaration Detail & Declarations List */}
        <div className="lg:col-span-5 space-y-4">
          {/* Declaration Detail Box */}
          {selectedRule && (
            <Card className="p-5 border border-[#DEE2E6] bg-white space-y-4">
              <div className="flex items-center justify-between border-b border-[#E9ECEF] pb-3">
                <div>
                  <span className="text-xs font-semibold text-[#1971C2]">{selectedRule.ruleId}</span>
                  <h2 className="text-base font-semibold text-[#212529]">{selectedRule.ruleName}</h2>
                </div>
                <Badge status={selectedRule.status} />
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="block font-medium text-[#868E96]">Detected Value:</span>
                  <span className="text-sm font-semibold text-[#212529]">
                    {selectedRule.detectedValue || 'Not Detected'}
                  </span>
                </div>

                <div>
                  <span className="block font-medium text-[#868E96]">OCR Extraction Confidence:</span>
                  <span className="text-xs text-[#212529]">
                    {selectedRule.confidence ? `${Math.round(selectedRule.confidence * 100)}%` : '0%'}
                  </span>
                </div>

                <div>
                  <span className="block font-medium text-[#868E96]">Verification Status Message:</span>
                  <p className="text-xs text-[#495057] bg-[#F8F9FA] p-2.5 rounded border border-[#E9ECEF]">
                    {selectedRule.message}
                  </p>
                </div>

                <div>
                  <span className="block font-medium text-[#868E96]">Raw OCR Extracted Segment:</span>
                  <div className="bg-[#212529] text-white font-mono p-3 rounded text-xs break-all overflow-x-auto">
                    {inspection.ocr_raw_text || 'No raw OCR segment available.'}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Interactive Declarations Selector List */}
          <Card className="p-4 border border-[#E9ECEF]">
            <h3 className="text-xs font-semibold text-[#495057] uppercase tracking-wider mb-3">
              Declarations List
            </h3>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {rules.map((rule) => {
                const isSelected = rule.ruleId === selectedRuleId;
                return (
                  <button
                    key={rule.ruleId}
                    onClick={() => setSelectedRuleId(rule.ruleId)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                      isSelected
                        ? 'bg-[#E7F0F9] text-[#1971C2] border border-[#1971C2]'
                        : 'text-[#495057] hover:bg-[#F8F9FA]'
                    }`}
                  >
                    <span className="truncate pr-2">
                      ▸ {rule.ruleName}
                    </span>
                    <Badge status={rule.status} />
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
