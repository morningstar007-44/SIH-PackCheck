import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useInspectionContext } from '../contexts/InspectionContext';
import { Button, Card, Badge } from '../components/ui/Primitives';
import { Plus, ArrowRight, ShieldCheck, AlertTriangle, AlertCircle, FileText } from 'lucide-react';

export const OverviewPage: React.FC = () => {
  const { inspections } = useInspectionContext();
  const navigate = useNavigate();

  const totalCount = inspections.length;
  const compliantCount = inspections.filter((i) => i.overall_result === 'compliant').length;
  const reviewCount = inspections.filter((i) => i.overall_result === 'requires_review').length;
  const issueCount = inspections.filter((i) => i.overall_result === 'non_compliant' || (i.rules_failed && i.rules_failed > 0)).length;

  const needsAttention = inspections.filter(
    (i) => i.overall_result === 'requires_review' || i.overall_result === 'non_compliant' || (i.rules_failed && i.rules_failed > 0)
  );

  const recentInspections = inspections.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E9ECEF]">
        <div>
          <h1 className="text-2xl font-semibold text-[#212529]">Overview</h1>
          <p className="text-sm text-[#495057]">
            Review recent inspections and packages requiring legal metrology attention.
          </p>
        </div>
        <Button
          onClick={() => navigate('/inspection/new')}
          icon={<Plus size={18} />}
        >
          New Inspection
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex flex-col justify-between">
          <span className="text-xs font-medium text-[#495057]">Total Inspections</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-bold text-[#212529]">{totalCount}</span>
            <FileText className="text-[#868E96]" size={20} />
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <span className="text-xs font-medium text-[#2B8A3E]">Compliant Packages</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-bold text-[#2B8A3E]">{compliantCount}</span>
            <ShieldCheck className="text-[#2B8A3E]" size={20} />
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <span className="text-xs font-medium text-[#E67700]">Requires Review</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-bold text-[#E67700]">{reviewCount}</span>
            <AlertTriangle className="text-[#E67700]" size={20} />
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <span className="text-xs font-medium text-[#C92A2A]">Potential Issues</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-bold text-[#C92A2A]">{issueCount}</span>
            <AlertCircle className="text-[#C92A2A]" size={20} />
          </div>
        </Card>
      </div>

      {/* Needs Attention Section */}
      {needsAttention.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-[#212529]">Needs Attention</h2>
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F8F9FA] border-b border-[#E9ECEF] text-xs font-medium text-[#495057]">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9ECEF]">
                  {needsAttention.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => navigate(`/inspection/${item.id}/result`)}
                      className="hover:bg-[#F8F9FA] cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3.5 font-medium text-[#212529]">
                        {item.product_name || 'Unspecified Product'}
                      </td>
                      <td className="px-4 py-3.5 text-[#495057]">{item.category || 'General'}</td>
                      <td className="px-4 py-3.5 text-[#868E96] text-xs">
                        {new Date(item.inspection_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3.5 font-semibold">{item.compliance_score || 0}%</td>
                      <td className="px-4 py-3.5">
                        <Badge
                          status={
                            item.overall_result === 'non_compliant' || (item.rules_failed && item.rules_failed > 0)
                              ? 'fail'
                              : 'review'
                          }
                        />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="inline-flex items-center text-xs text-[#1971C2] font-medium">
                          Review <ArrowRight size={14} className="ml-1" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      )}

      {/* Recent Inspections Table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#212529]">Recent Inspections</h2>
          <Link to="/history" className="text-xs text-[#1971C2] font-medium hover:underline">
            View All History →
          </Link>
        </div>

        {recentInspections.length === 0 ? (
          <Card className="text-center py-12">
            <h3 className="text-base font-medium text-[#212529]">No inspections yet</h3>
            <p className="text-xs text-[#868E96] mt-1 max-w-sm mx-auto">
              Start your first package inspection to capture product images and verify Legal Metrology declarations.
            </p>
            <Button
              className="mt-4"
              onClick={() => navigate('/inspection/new')}
              icon={<Plus size={16} />}
            >
              New Inspection
            </Button>
          </Card>
        ) : (
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F8F9FA] border-b border-[#E9ECEF] text-xs font-medium text-[#495057]">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9ECEF]">
                  {recentInspections.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => navigate(`/inspection/${item.id}/result`)}
                      className="hover:bg-[#F8F9FA] cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3.5 font-medium text-[#212529]">
                        {item.product_name || 'Unspecified Product'}
                      </td>
                      <td className="px-4 py-3.5 text-[#495057]">{item.category || 'General'}</td>
                      <td className="px-4 py-3.5 text-[#868E96] text-xs">
                        {new Date(item.inspection_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3.5 font-semibold">{item.compliance_score || 0}%</td>
                      <td className="px-4 py-3.5">
                        <Badge
                          status={
                            item.overall_result === 'compliant'
                              ? 'compliant'
                              : item.overall_result === 'non_compliant'
                              ? 'fail'
                              : 'requires_review'
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>
    </div>
  );
};
