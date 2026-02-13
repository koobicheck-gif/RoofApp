import { useState, useMemo } from 'react';
import { Card, Select } from '../ui';
import { useAllEstimates, useEstimate } from '../../context/EstimateContext';
import { usePricing } from '../../context/PricingContext';
import { calculateEstimate, formatCurrency, formatDate } from '../../utils/calculateEstimate';
import { SHINGLE_TYPE_NAMES } from '../../data/defaultPricing';
import type { Estimate } from '../../types';

type StatusFilter = 'all' | Estimate['status'];
type SortBy = 'date' | 'amount' | 'customer';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'approved', label: 'Approved' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'invoiced', label: 'Invoiced' },
  { value: 'void', label: 'Void' },
];

const STATUS_COLORS: Record<Estimate['status'], string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  scheduled: 'bg-purple-100 text-purple-700',
  completed: 'bg-emerald-100 text-emerald-700',
  invoiced: 'bg-amber-100 text-amber-700',
  void: 'bg-red-100 text-red-700',
};

export function EstimatesManager() {
  const estimates = useAllEstimates();
  const { dispatch } = useEstimate();
  const { state: pricingState } = usePricing();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredEstimates = useMemo(() => {
    let filtered = [...estimates];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((e) => e.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.customer.name.toLowerCase().includes(search) ||
          e.customer.address.toLowerCase().includes(search) ||
          e.estimateNumber.toLowerCase().includes(search)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'amount':
          return getEstimateTotal(b) - getEstimateTotal(a);
        case 'customer':
          return a.customer.name.localeCompare(b.customer.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [estimates, statusFilter, sortBy, searchTerm, pricingState]);

  const updateStatus = (id: string, status: Estimate['status']) => {
    dispatch({ type: 'UPDATE_ESTIMATE_STATUS', payload: { id, status } });
  };

  const deleteEstimate = (id: string) => {
    if (confirm('Delete this estimate? This cannot be undone.')) {
      dispatch({ type: 'DELETE_ESTIMATE', payload: id });
    }
  };

  const duplicateEstimate = (id: string) => {
    dispatch({ type: 'DUPLICATE_ESTIMATE', payload: id });
  };

  // Stats
  const totalEstimates = estimates.length;
  const totalValue = estimates.reduce((sum, e) => sum + getEstimateTotal(e), 0);
  const approvedCount = estimates.filter((e) => e.status === 'approved' || e.status === 'scheduled' || e.status === 'completed' || e.status === 'invoiced').length;
  const approvalRate = totalEstimates > 0 ? (approvedCount / totalEstimates) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{totalEstimates}</div>
            <div className="text-xs text-gray-500">Total Estimates</div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalValue)}</div>
            <div className="text-xs text-gray-500">Total Value</div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{approvalRate.toFixed(0)}%</div>
            <div className="text-xs text-gray-500">Approval Rate</div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {totalEstimates > 0 ? formatCurrency(totalValue / totalEstimates) : '$0'}
            </div>
            <div className="text-xs text-gray-500">Avg. Value</div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, address, or estimate #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as StatusFilter)}
            options={STATUS_OPTIONS}
          />
          <Select
            value={sortBy}
            onChange={(value) => setSortBy(value as SortBy)}
            options={[
              { value: 'date', label: 'Sort by Date' },
              { value: 'amount', label: 'Sort by Amount' },
              { value: 'customer', label: 'Sort by Customer' },
            ]}
          />
        </div>
      </Card>

      {/* Estimates List */}
      <Card padding="none">
        {filteredEstimates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm || statusFilter !== 'all'
              ? 'No estimates match your filters'
              : 'No estimates yet'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredEstimates.map((estimate) => {
              const total = getEstimateTotal(estimate);

              return (
                <div key={estimate.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 truncate">
                          {estimate.customer.name || 'Unnamed Customer'}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            STATUS_COLORS[estimate.status]
                          }`}
                        >
                          {estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {estimate.customer.address}
                        {estimate.customer.city && `, ${estimate.customer.city}`}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span>{estimate.estimateNumber}</span>
                        <span>{formatDate(estimate.createdAt)}</span>
                        <span>{SHINGLE_TYPE_NAMES[estimate.shingleType]}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-bold text-blue-600">
                        {formatCurrency(total)}
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        <select
                          value={estimate.status}
                          onChange={(e) => updateStatus(estimate.id, e.target.value as Estimate['status'])}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="draft">Draft</option>
                          <option value="sent">Sent</option>
                          <option value="approved">Approved</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="completed">Completed</option>
                          <option value="invoiced">Invoiced</option>
                          <option value="void">Void</option>
                        </select>
                        <button
                          onClick={() => duplicateEstimate(estimate.id)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Duplicate"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteEstimate(estimate.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
