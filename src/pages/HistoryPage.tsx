import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInspectionContext } from '../contexts/InspectionContext';
import { Button, Card, Badge } from '../components/ui/Primitives';
import { Search, PlusCircle } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { inspections } = useInspectionContext();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredInspections = inspections.filter((item) => {
    const matchesSearch =
      (item.product_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'compliant' && item.overall_result === 'compliant') ||
      (statusFilter === 'requires_review' && item.overall_result === 'requires_review') ||
      (statusFilter === 'non_compliant' && item.overall_result === 'non_compliant');

    const matchesCategory =
      categoryFilter === 'all' || (item.category || '').toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E9ECEF]">
        <div>
          <h1 className="text-2xl font-semibold text-[#212529]">Inspection History</h1>
          <p className="text-sm text-[#495057]">
            Archive of completed legal metrology package inspection records.
          </p>
        </div>
        <Button onClick={() => navigate('/inspection/new')} icon={<PlusCircle size={18} />}>
          New Inspection
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-white space-y-3 md:space-y-0 md:flex md:items-center md:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-[#868E96]" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Product Name or Inspection ID..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-[#DEE2E6] rounded-lg text-sm text-[#212529] focus:outline-none focus:ring-2 focus:ring-[#1971C2]"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-[#DEE2E6] rounded-lg px-3 py-2 text-sm text-[#495057] focus:outline-none focus:ring-2 focus:ring-[#1971C2]"
          >
            <option value="all">All Statuses</option>
            <option value="compliant">Compliant</option>
            <option value="requires_review">Requires Review</option>
            <option value="non_compliant">Potential Issue</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-[#DEE2E6] rounded-lg px-3 py-2 text-sm text-[#495057] focus:outline-none focus:ring-2 focus:ring-[#1971C2]"
          >
            <option value="all">All Categories</option>
            <option value="Food & Beverages">Food & Beverages</option>
            <option value="Personal Care">Personal Care</option>
            <option value="Household">Household</option>
            <option value="Electronics">Electronics</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </Card>

      {/* History Data Table */}
      <Card className="p-0 overflow-hidden">
        {filteredInspections.length === 0 ? (
          <div className="text-center py-12 px-4 text-[#868E96] text-sm">
            No inspection records match the active search and filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F8F9FA] border-b border-[#E9ECEF] text-xs font-medium text-[#495057]">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9ECEF]">
                {filteredInspections.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => navigate(`/inspection/${item.id}/result`)}
                    className="hover:bg-[#F8F9FA] cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3.5 font-mono text-xs text-[#1971C2] font-semibold">
                      {item.id}
                    </td>
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
        )}
      </Card>
    </div>
  );
};
