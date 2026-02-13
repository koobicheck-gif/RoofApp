import React from 'react';
import { Card, Button } from './ui';
import { useAllEstimates, useEstimate } from '../context/EstimateContext';
import { usePricing } from '../context/PricingContext';
import { calculateEstimate, formatCurrency, formatDate } from '../utils/calculateEstimate';
import { SHINGLE_TYPE_NAMES } from '../data/defaultPricing';
import type { Estimate } from '../types';

interface EstimateListProps {
  onSelectEstimate: (id: string) => void;
  onNewEstimate: () => void;
  onOpenAdmin?: () => void;
}

export function EstimateList({ onSelectEstimate, onNewEstimate, onOpenAdmin }: EstimateListProps) {
  const estimates = useAllEstimates();
  const { dispatch } = useEstimate();
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

  const getStatusColor = (status: Estimate['status']): string => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      case 'sent':
        return 'bg-blue-100 text-blue-700';
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'scheduled':
        return 'bg-purple-100 text-purple-700';
      case 'completed':
        return 'bg-emerald-100 text-emerald-700';
      case 'invoiced':
        return 'bg-amber-100 text-amber-700';
      case 'void':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this estimate?')) {
      dispatch({ type: 'DELETE_ESTIMATE', payload: id });
    }
  };

  const handleDuplicate = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dispatch({ type: 'DUPLICATE_ESTIMATE', payload: id });
  };

  // Sort estimates by date (newest first)
  const sortedEstimates = [...estimates].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-700 text-white">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">Roof Repair Partners</h1>
              <p className="text-blue-200 text-sm mt-1">
                Oklahoma's Only Repair-Focused Roofing Company
              </p>
            </div>
            {onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="p-2 hover:bg-blue-600 rounded-lg transition-colors"
                title="Admin Dashboard"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* New Estimate Button */}
        <Button fullWidth size="lg" onClick={onNewEstimate} className="mb-6">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Estimate
        </Button>

        {/* Estimates List */}
        {sortedEstimates.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No estimates yet</h3>
            <p className="text-gray-500">Create your first estimate to get started</p>
          </Card>
        ) : (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Recent Estimates ({sortedEstimates.length})
            </h2>
            {sortedEstimates.map((estimate) => (
              <Card
                key={estimate.id}
                padding="none"
                className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onSelectEstimate(estimate.id)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {estimate.customer.name || 'Unnamed Customer'}
                        </h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(estimate.status)}`}
                        >
                          {estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {estimate.customer.address || 'No address'}
                        {estimate.customer.city && `, ${estimate.customer.city}`}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span>{estimate.estimateNumber}</span>
                        <span>•</span>
                        <span>{formatDate(estimate.createdAt)}</span>
                        <span>•</span>
                        <span>{SHINGLE_TYPE_NAMES[estimate.shingleType]}</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-lg font-bold text-blue-600">
                        {formatCurrency(getEstimateTotal(estimate))}
                      </div>
                      <div className="flex gap-1 mt-2">
                        <button
                          onClick={(e) => handleDuplicate(e, estimate.id)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Duplicate"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, estimate.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
