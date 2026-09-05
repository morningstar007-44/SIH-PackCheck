import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInspectionContext } from '../contexts/InspectionContext';
import { useAuth } from '../contexts/AuthContext';
import { generateInspectionReport } from '../services/report/pdfGenerator';
import { Button, Card, Badge } from '../components/ui/Primitives';
import { Download, Printer, ArrowLeft } from 'lucide-react';

export const ReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getInspectionById } = useInspectionContext();
  const { profile, user } = useAuth();

  const inspection = id ? getInspectionById(id) : undefined;
  const inspectorName = profile?.full_name || user?.email || 'Inspector';

  if (!inspection) {
    return (
      <div className="max-w-xl mx-auto text-center py-12 space-y-4">
        <h2 className="text-xl font-semibold text-[#212529]">Inspection report not available</h2>
        <Button onClick={() => navigate('/overview')}>Return to Overview</Button>
      </div>
    );
  }

  const handleDownloadPDF = () => {
    const doc = generateInspectionReport(inspection, inspectorName);
    doc.save(`PackCheck_Report_${inspection.id}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  const rules = inspection.rule_results || [];

  return (
    <div className="max-w-3xl mx-auto space-y-6 print:max-w-none print:m-0 print:p-0">
      {/* Action Header Controls (Hidden during browser print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E9ECEF] print:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/inspection/${inspection.id}/result`)}
          icon={<ArrowLeft size={16} />}
        >
          Back to Result
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handlePrint} icon={<Printer size={16} />}>
            Print Report
          </Button>
          <Button onClick={handleDownloadPDF} icon={<Download size={16} />}>
            Download PDF
          </Button>
        </div>
      </div>

      {/* Official Government Inspection Document Card */}
      <Card className="p-8 bg-white border border-[#DEE2E6] space-y-6 shadow-sm print:border-none print:shadow-none">
        {/* Document Header */}
        <div className="text-center pb-6 border-b border-[#DEE2E6] space-y-1">
          <h1 className="text-2xl font-bold text-[#212529] uppercase tracking-wide">
            PackCheck — Inspection Report
          </h1>
          <p className="text-xs text-[#495057]">
            Legal Metrology (Packaged Commodities) Rules Official Inspection Assessment
          </p>
        </div>

        {/* Section 1: Metadata */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="font-semibold text-[#868E96] block">Inspection ID:</span>
            <span className="text-sm font-mono text-[#212529]">{inspection.id}</span>
          </div>
          <div>
            <span className="font-semibold text-[#868E96] block">Inspection Date:</span>
            <span className="text-sm text-[#212529]">
              {new Date(inspection.inspection_date).toLocaleString('en-IN')}
            </span>
          </div>
          <div>
            <span className="font-semibold text-[#868E96] block">Inspector:</span>
            <span className="text-sm text-[#212529]">{inspectorName}</span>
          </div>
          <div>
            <span className="font-semibold text-[#868E96] block">Product & Category:</span>
            <span className="text-sm text-[#212529]">
              {inspection.product_name || 'Unspecified'} ({inspection.category || 'General'})
            </span>
          </div>
        </div>

        <div className="h-px bg-[#E9ECEF]" />

        {/* Section 2: Summary */}
        <div>
          <h2 className="text-sm font-semibold text-[#212529] mb-3">Compliance Summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-[#F8F9FA] rounded-lg border border-[#E9ECEF] text-center">
            <div>
              <span className="text-xs text-[#868E96] block">Compliance Score</span>
              <span className="text-xl font-bold text-[#212529]">{inspection.compliance_score}%</span>
            </div>
            <div>
              <span className="text-xs text-[#868E96] block">Overall Status</span>
              <div className="mt-1">
                <Badge status={inspection.overall_result || 'requires_review'} />
              </div>
            </div>
            <div>
              <span className="text-xs text-[#868E96] block">Rules Verified</span>
              <span className="text-xl font-bold text-[#2B8A3E]">{inspection.rules_passed}</span>
            </div>
            <div>
              <span className="text-xs text-[#868E96] block">Requires Review</span>
              <span className="text-xl font-bold text-[#E67700]">{inspection.rules_review}</span>
            </div>
          </div>
        </div>

        {/* Section 3: Declaration Details Table */}
        <div>
          <h2 className="text-sm font-semibold text-[#212529] mb-3">Declaration Details</h2>
          <table className="w-full text-left text-xs border border-[#E9ECEF]">
            <thead className="bg-[#F8F9FA] border-b border-[#E9ECEF]">
              <tr>
                <th className="px-3 py-2 border-r border-[#E9ECEF]">Rule / Declaration</th>
                <th className="px-3 py-2 border-r border-[#E9ECEF]">Detected Value</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9ECEF]">
              {rules.map((res) => (
                <tr key={res.ruleId}>
                  <td className="px-3 py-2 border-r border-[#E9ECEF] font-medium text-[#212529]">
                    {res.ruleName}
                  </td>
                  <td className="px-3 py-2 border-r border-[#E9ECEF] text-[#495057]">
                    {res.detectedValue || 'Not detected'}
                  </td>
                  <td className="px-3 py-2">
                    <Badge status={res.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 4: Legal Disclaimer */}
        <div className="pt-6 border-t border-[#DEE2E6] text-[11px] text-[#868E96] space-y-1 italic">
          <p>
            <strong>Disclaimer:</strong> This report is generated to assist in package inspection and is intended as a preliminary digital assessment. Findings should be manually verified by a qualified inspector before any enforcement or legal action. This report does not constitute a final legal determination.
          </p>
          <p>Generated by PackCheck Legal Metrology Portal on {new Date().toISOString()}</p>
        </div>
      </Card>
    </div>
  );
};
