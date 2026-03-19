import { useMemo, useState, useEffect } from 'react';
import { Card } from '../ui';
import { useAllEstimates } from '../../context/EstimateContext';
import { usePricing } from '../../context/PricingContext';
import { calculateEstimate, formatCurrency } from '../../utils/calculateEstimate';
import { SHINGLE_TYPE_NAMES } from '../../data/defaultPricing';
import type { Estimate, ShingleType } from '../../types';

const DRAFTS_STORAGE_KEY = 'roofapp_report_drafts';

interface ReportDraft {
  id: string;
  savedAt: string;
  reportNumber: string;
  date: string;
  propertyAddress: string;
  clientName: string;
  inspectorName: string;
  phone: string;
  roofAge: string;
  overallCondition: string;
  recommendedAction: string;
}

interface ReportsViewProps {
  onOpenInspectionReport?: () => void;
}

export function ReportsView({ onOpenInspectionReport }: ReportsViewProps) {
  const estimates = useAllEstimates();
  const { state: pricingState } = usePricing();
  const [drafts, setDrafts] = useState<ReportDraft[]>([]);

  // Load drafts
  useEffect(() => {
    const stored = localStorage.getItem(DRAFTS_STORAGE_KEY);
    if (stored) {
      try {
        setDrafts(JSON.parse(stored));
      } catch {
        setDrafts([]);
      }
    }
  }, []);

  const deleteDraft = (draftId: string) => {
    if (!confirm('Delete this draft?')) return;
    const stored = localStorage.getItem(DRAFTS_STORAGE_KEY);
    if (stored) {
      try {
        const existingDrafts: ReportDraft[] = JSON.parse(stored);
        const filtered = existingDrafts.filter(d => d.id !== draftId);
        localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(filtered));
        setDrafts(filtered);
      } catch {
        // Ignore
      }
    }
  };

  const getEstimateTotal = (estimate: Estimate): number => {
    const calculation = calculateEstimate({
      estimate,
      shinglePricing: pricingState.shinglePricing,
      additionalRepairs: pricingState.additionalRepairs,
      pitchMultipliers: pricingState.pitchMultipliers,
      accessibilityMultipliers: pricingState.accessibilityMultipliers,
      fixedFees: pricingState.fixedFees,
      warrantyOptions: pricingState.warrantyOptions,
    });
    return calculation.grandTotal;
  };

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // This month's estimates
    const thisMonthEstimates = estimates.filter((e) => {
      const date = new Date(e.createdAt);
      return date >= thisMonth && date <= thisMonthEnd;
    });

    // Last month's estimates
    const lastMonthEstimates = estimates.filter((e) => {
      const date = new Date(e.createdAt);
      return date >= lastMonth && date < thisMonth;
    });

    // Calculate totals
    const thisMonthTotal = thisMonthEstimates.reduce((sum, e) => sum + getEstimateTotal(e), 0);
    const lastMonthTotal = lastMonthEstimates.reduce((sum, e) => sum + getEstimateTotal(e), 0);

    // Status breakdown
    const statusCounts = estimates.reduce(
      (acc, e) => {
        acc[e.status] = (acc[e.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Shingle type breakdown
    const shingleCounts = estimates.reduce(
      (acc, e) => {
        acc[e.shingleType] = (acc[e.shingleType] || 0) + 1;
        return acc;
      },
      {} as Record<ShingleType, number>
    );

    // Approved revenue
    const approvedStatuses = ['approved', 'scheduled', 'completed', 'invoiced'];
    const approvedEstimates = estimates.filter((e) => approvedStatuses.includes(e.status));
    const approvedRevenue = approvedEstimates.reduce((sum, e) => sum + getEstimateTotal(e), 0);

    // Pending revenue
    const pendingStatuses = ['draft', 'sent'];
    const pendingEstimates = estimates.filter((e) => pendingStatuses.includes(e.status));
    const pendingRevenue = pendingEstimates.reduce((sum, e) => sum + getEstimateTotal(e), 0);

    // Average estimate value
    const avgValue = estimates.length > 0 ? estimates.reduce((sum, e) => sum + getEstimateTotal(e), 0) / estimates.length : 0;

    // Conversion rate
    const sentOrLater = estimates.filter((e) => e.status !== 'draft').length;
    const converted = approvedEstimates.length;
    const conversionRate = sentOrLater > 0 ? (converted / sentOrLater) * 100 : 0;

    return {
      thisMonthCount: thisMonthEstimates.length,
      thisMonthTotal,
      lastMonthCount: lastMonthEstimates.length,
      lastMonthTotal,
      statusCounts,
      shingleCounts,
      approvedRevenue,
      pendingRevenue,
      avgValue,
      conversionRate,
      totalEstimates: estimates.length,
    };
  }, [estimates, pricingState]);

  const monthChange = stats.lastMonthTotal > 0
    ? ((stats.thisMonthTotal - stats.lastMonthTotal) / stats.lastMonthTotal) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(stats.thisMonthTotal)}
            </div>
            <div className="text-sm text-gray-500 mt-1">This Month</div>
            <div className="text-xs text-gray-400">
              {stats.thisMonthCount} estimate{stats.thisMonthCount !== 1 ? 's' : ''}
            </div>
            {monthChange !== 0 && (
              <div className={`text-xs mt-1 ${monthChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {monthChange > 0 ? '↑' : '↓'} {Math.abs(monthChange).toFixed(0)}% vs last month
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(stats.approvedRevenue)}
            </div>
            <div className="text-sm text-gray-500 mt-1">Approved Revenue</div>
            <div className="text-xs text-gray-400">
              {stats.statusCounts.approved || 0} approved, {stats.statusCounts.scheduled || 0} scheduled
            </div>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-amber-600">
              {formatCurrency(stats.pendingRevenue)}
            </div>
            <div className="text-sm text-gray-500 mt-1">Pending Revenue</div>
            <div className="text-xs text-gray-400">
              {stats.statusCounts.draft || 0} draft, {stats.statusCounts.sent || 0} sent
            </div>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {stats.conversionRate.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-500 mt-1">Conversion Rate</div>
            <div className="text-xs text-gray-400">
              Sent → Approved
            </div>
          </div>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Estimates by Status</h3>
          <div className="space-y-3">
            {[
              { key: 'draft', label: 'Draft', color: 'bg-gray-400' },
              { key: 'sent', label: 'Sent', color: 'bg-blue-500' },
              { key: 'approved', label: 'Approved', color: 'bg-green-500' },
              { key: 'scheduled', label: 'Scheduled', color: 'bg-purple-500' },
              { key: 'completed', label: 'Completed', color: 'bg-emerald-500' },
              { key: 'invoiced', label: 'Invoiced', color: 'bg-amber-500' },
              { key: 'void', label: 'Void', color: 'bg-red-500' },
            ].map(({ key, label, color }) => {
              const count = stats.statusCounts[key] || 0;
              const percentage = stats.totalEstimates > 0 ? (count / stats.totalEstimates) * 100 : 0;
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Shingle Type Breakdown */}
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Estimates by Shingle Type</h3>
          <div className="space-y-4">
            {(['three-tab', 'architectural', 'premium'] as ShingleType[]).map((type) => {
              const count = stats.shingleCounts[type] || 0;
              const percentage = stats.totalEstimates > 0 ? (count / stats.totalEstimates) * 100 : 0;
              return (
                <div key={type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{SHINGLE_TYPE_NAMES[type]}</span>
                    <span className="font-medium">{count} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Estimate Value</span>
              <span className="text-xl font-bold text-blue-600">
                {formatCurrency(stats.avgValue)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Monthly Comparison */}
      <Card>
        <h3 className="font-semibold text-gray-900 mb-4">Monthly Comparison</h3>
        <div className="grid grid-cols-2 gap-8">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500 mb-2">Last Month</div>
            <div className="text-2xl font-bold text-gray-700">
              {formatCurrency(stats.lastMonthTotal)}
            </div>
            <div className="text-sm text-gray-400">
              {stats.lastMonthCount} estimate{stats.lastMonthCount !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-600 mb-2">This Month</div>
            <div className="text-2xl font-bold text-blue-700">
              {formatCurrency(stats.thisMonthTotal)}
            </div>
            <div className="text-sm text-blue-400">
              {stats.thisMonthCount} estimate{stats.thisMonthCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.totalEstimates}</div>
            <div className="text-xs text-gray-500">Total Estimates</div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">
              {stats.statusCounts.completed || 0}
            </div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">
              {stats.statusCounts.invoiced || 0}
            </div>
            <div className="text-xs text-gray-500">Invoiced</div>
          </div>
        </Card>
      </div>

      {/* Inspection Report Drafts */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Inspection Report Drafts</h3>
            <p className="text-sm text-gray-500">Saved PDF inspection reports</p>
          </div>
          {onOpenInspectionReport && (
            <button
              onClick={onOpenInspectionReport}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Report
            </button>
          )}
        </div>

        {drafts.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500">No saved drafts</p>
            <p className="text-sm text-gray-400 mt-1">Create an inspection report and save it as a draft</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Property</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Report #</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Condition</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Saved</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {drafts.map(draft => (
                  <tr key={draft.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900 truncate max-w-[200px]">
                        {draft.propertyAddress || 'No address'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {draft.clientName || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-mono text-gray-500">{draft.reportNumber}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        draft.overallCondition === 'Good' ? 'bg-green-100 text-green-800' :
                        draft.overallCondition === 'Fair' ? 'bg-amber-100 text-amber-800' :
                        draft.overallCondition === 'Poor' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {draft.overallCondition}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(draft.savedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onOpenInspectionReport && (
                          <button
                            onClick={onOpenInspectionReport}
                            className="px-3 py-1.5 text-sm font-medium text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors"
                          >
                            Open
                          </button>
                        )}
                        <button
                          onClick={() => deleteDraft(draft.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
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
}
