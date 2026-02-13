import { useMemo } from 'react';
import { Card } from '../ui';
import { useAllEstimates } from '../../context/EstimateContext';
import { usePricing } from '../../context/PricingContext';
import { calculateEstimate, formatCurrency } from '../../utils/calculateEstimate';
import { SHINGLE_TYPE_NAMES } from '../../data/defaultPricing';
import type { Estimate, ShingleType } from '../../types';

export function ReportsView() {
  const estimates = useAllEstimates();
  const { state: pricingState } = usePricing();

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
    </div>
  );
}
