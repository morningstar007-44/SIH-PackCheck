import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInspectionContext } from '../contexts/InspectionContext';
import { Button, Card, Badge } from '../components/ui/Primitives';
import { FileText, Eye, PlusCircle, AlertTriangle } from 'lucide-react';

export const InspectionResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getInspectionById } = useInspectionContext();

  const inspection = id ? getInspectionById(id) : undefined;

  if (!inspection) {
    return (
      <div className="max-w-xl mx-auto text-center py-12 space-y-4">
        <h2 className="text-xl font-semibold text-[#212529]">Inspection record not found</h2>
        <p className="text-sm text-[#495057]">
          The requested inspection ID ({id}) could not be retrieved from records.
        </p>
        <Button onClick={() => navigate('/overview')}>Return to Overview</Button>
      </div>
    );
  }

  const score = inspection.compliance_score || 0;
  const resultStatus = inspection.overall_result || 'requires_review';
  const rules = inspection.rule_results || [];

  const declarationRows = [
    { label: 'Manufacturer Details', field: 'manufacturer', key: 'LM-PC-001' },
    { label: 'Generic Name', field: 'genericName', key: 'LM-PC-002' },
    { label: 'Net Quantity', field: 'netQuantity', key: 'LM-PC-003' },
    { label: 'MRP', field: 'mrp', key: 'LM-PC-004' },
    { label: 'Mfg. Date', field: 'manufacturingDate', key: 'LM-PC-005' },
    { label: 'Best Before', field: 'bestBefore', key: 'LM-PC-006' },
    { label: 'Batch No.', field: 'batchNumber', key: 'LM-PC-009' },
    { label: 'Consumer Care', field: 'consumerCare', key: 'LM-PC-007' },
    { label: 'Country of Origin', field: 'countryOfOrigin', key: 'LM-PC-008' },
    { label: 'FSSAI Lic. (Food)', field: 'fssaiLicense', key: 'LM-PC-010' },
  ];

  const potentialIssues = rules.filter((r) => r.status === 'fail' || r.status === 'review');

  return (
    <div className="space-y-6">
      {/* Top Navigation / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E9ECEF]">
        <div>
          <h1 className="text-2xl font-semibold text-[#212529]">Inspection Result</h1>
          <p className="text-xs text-[#868E96] mt-0.5">
            ID: {inspection.id} • Date: {new Date(inspection.inspection_date).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => navigate(`/inspection/${inspection.id}/evidence`)}
            icon={<Eye size={16} />}
          >
            Review Evidence
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate(`/inspection/${inspection.id}/report`)}
            icon={<FileText size={16} />}
          >
            Generate Report
          </Button>
          <Button onClick={() => navigate('/inspection/new')} icon={<PlusCircle size={16} />}>
            New Inspection
          </Button>
        </div>
      </div>

      {/* Compliance Score Summary Header Box (Strictly using big clean typography per prompt rule) */}
      <Card className="p-6 border border-[#E9ECEF] bg-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-[#212529]">
              Product: {inspection.product_name || 'Unspecified Package'}
            </h2>
            <p className="text-sm text-[#495057]">
              Category: {inspection.category || 'General Commodity'}
            </p>
          </div>

          <div className="flex items-center gap-6 p-4 bg-[#F8F9FA] rounded-lg border border-[#E9ECEF]">
            <div className="text-center">
              <span className="block text-3xl font-bold text-[#212529]">{score}%</span>
              <span className="text-xs text-[#868E96] font-medium">Compliance Score</span>
            </div>

            <div className="h-10 w-px bg-[#DEE2E6]" />

            <div>
              <div className="mb-1">
                <Badge status={resultStatus} />
              </div>
              <span className="text-xs text-[#495057]">
                {inspection.rules_passed} of {inspection.total_rules_checked} declarations verified
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Mandatory Declarations Verification Table */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-[#212529]">Mandatory Declarations</h2>
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F8F9FA] border-b border-[#E9ECEF] text-xs font-medium text-[#495057]">
                <tr>
                  <th className="px-4 py-3">Field</th>
                  <th className="px-4 py-3">Detected Value</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9ECEF]">
                {declarationRows.map((row) => {
                  const ruleRes = rules.find((r) => r.ruleId === row.key);
                  const status = ruleRes?.status || 'not_applicable';
                  const val = ruleRes?.detectedValue || 'Not detected';

                  return (
                    <tr key={row.key} className="hover:bg-[#F8F9FA] transition-colors">
                      <td className="px-4 py-3 font-medium text-[#212529]">{row.label}</td>
                      <td className="px-4 py-3 text-[#495057]">
                        {val === 'Not detected' ? (
                          <span className="text-[#868E96] italic">Not detected</span>
                        ) : (
                          val
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge status={status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* Potential Issues / Review Items Section (Enforcing non-aggressive legal wording) */}
      {potentialIssues.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-[#212529]">
            Potential Issues Requiring Inspector Review ({potentialIssues.length})
          </h2>
          <div className="space-y-3">
            {potentialIssues.map((issue) => (
              <Card key={issue.ruleId} className="border-l-4 border-l-[#E67700] p-4 bg-white">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-[#E67700] shrink-0 mt-0.5" size={20} />
                  <div className="space-y-1 flex-1">
                    <h3 className="text-sm font-semibold text-[#212529]">{issue.ruleName}</h3>
                    <p className="text-xs text-[#495057]">{issue.message}</p>
                    <p className="text-xs text-[#868E96]">
                      Manual verification is recommended prior to formal report sign-off.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/inspection/${inspection.id}/evidence`)}
                  >
                    Review Evidence
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
