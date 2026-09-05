import React, { useState } from 'react';
import { DEFAULT_RULES } from '../services/rules/defaultRules';
import { Card } from '../components/ui/Primitives';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const RulesPage: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>('LM-PC-001');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#212529]">Inspection Rules</h1>
        <p className="text-sm text-[#495057]">
          Reference database of Legal Metrology (Packaged Commodities) compliance rules.
        </p>
      </div>

      <Card className="p-4 bg-[#E7F0F9] border border-[#1971C2]/20 flex items-center justify-between text-xs text-[#1971C2]">
        <div>
          <span className="font-semibold block">Active Rule Set:</span>
          <span>Legal Metrology (Packaged Commodities) Rules</span>
        </div>
        <div>
          <span className="font-semibold block">Version:</span>
          <span>2026 Edition</span>
        </div>
      </Card>

      {/* Rules Reference Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F8F9FA] border-b border-[#E9ECEF] text-xs font-medium text-[#495057]">
              <tr>
                <th className="px-4 py-3">Rule ID</th>
                <th className="px-4 py-3">Field</th>
                <th className="px-4 py-3">Requirement Name</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9ECEF]">
              {DEFAULT_RULES.map((rule) => {
                const isExpanded = expandedId === rule.id;
                return (
                  <React.Fragment key={rule.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : rule.id)}
                      className="hover:bg-[#F8F9FA] cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3.5 font-mono text-xs text-[#1971C2] font-semibold">
                        {rule.id}
                      </td>
                      <td className="px-4 py-3.5 text-[#495057] font-mono text-xs">{rule.field}</td>
                      <td className="px-4 py-3.5 font-medium text-[#212529]">{rule.name}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                            rule.severity === 'high'
                              ? 'bg-[#FFF5F5] text-[#C92A2A]'
                              : 'bg-[#FFF9DB] text-[#E67700]'
                          }`}
                        >
                          {rule.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right text-[#868E96]">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </td>
                    </tr>

                    {/* Accordion Detail View for Rule */}
                    {isExpanded && (
                      <tr className="bg-[#F8F9FA]">
                        <td colSpan={5} className="px-6 py-4 border-t border-b border-[#DEE2E6]">
                          <div className="space-y-3 text-xs">
                            <div>
                              <span className="font-semibold text-[#212529] block mb-0.5">
                                Requirement:
                              </span>
                              <p className="text-[#495057]">{rule.description}</p>
                            </div>

                            <div>
                              <span className="font-semibold text-[#212529] block mb-0.5">
                                Statutory Reference:
                              </span>
                              <span className="text-[#1971C2] font-medium">{rule.reference}</span>
                            </div>

                            <div className="grid grid-cols-3 gap-4 pt-2">
                              <div>
                                <span className="font-semibold text-[#868E96] block">Check Type</span>
                                <span className="text-[#212529] uppercase">{rule.checkType}</span>
                              </div>
                              <div>
                                <span className="font-semibold text-[#868E96] block">Severity Level</span>
                                <span className="text-[#212529] capitalize">{rule.severity}</span>
                              </div>
                              <div>
                                <span className="font-semibold text-[#868E96] block">Applicability</span>
                                <span className="text-[#212529]">
                                  {rule.applicableTo.join(', ')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
