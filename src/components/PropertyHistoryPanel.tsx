import { useState, useMemo } from 'react';
import { useAllEstimates } from '../context/EstimateContext';
import { usePricing } from '../context/PricingContext';
import { calculateEstimate, formatCurrency, formatDate } from '../utils/calculateEstimate';
import { SHINGLE_TYPE_NAMES } from '../data/defaultPricing';
import type { Estimate } from '../types';

interface PropertyHistoryPanelProps {
  address: string;
  city: string;
  state: string;
  currentEstimateId?: string;
  onSelectEstimate?: (estimateId: string) => void;
}

export function PropertyHistoryPanel({
  address,
  city,
  state: _state,
  currentEstimateId,
  onSelectEstimate,
}: PropertyHistoryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const estimates = useAllEstimates();
  const { state: pricingState } = usePricing();

  // Find matching estimates by address
  const matchingEstimates = useMemo(() => {
    if (!address || address.length < 3) return [];

    const normalizeAddress = (addr: string) =>
      addr.toLowerCase().replace(/[^a-z0-9]/g, '');

    const normalizedSearch = normalizeAddress(address);

    return estimates
      .filter((est) => {
        if (est.id === currentEstimateId) return false;
        const normalizedEstAddress = normalizeAddress(est.customer.address);
        const normalizedEstCity = normalizeAddress(est.customer.city);

        // Match by partial address or city
        return (
          normalizedEstAddress.includes(normalizedSearch) ||
          normalizedSearch.includes(normalizedEstAddress) ||
          (city && normalizedEstCity === normalizeAddress(city))
        );
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5); // Limit to 5 most recent
  }, [address, city, estimates, currentEstimateId]);

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
      case 'completed':
      case 'invoiced':
        return 'bg-green-100 text-green-700';
      case 'approved':
      case 'scheduled':
        return 'bg-blue-100 text-blue-700';
      case 'void':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (matchingEstimates.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-amber-100/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <svg
              className="w-5 h-5 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="text-left">
            <div className="font-semibold text-amber-800">
              Property History Found
            </div>
            <div className="text-sm text-amber-600">
              {matchingEstimates.length} previous estimate
              {matchingEstimates.length > 1 ? 's' : ''} at this address
            </div>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-amber-600 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          {matchingEstimates.map((est) => (
            <div
              key={est.id}
              onClick={() => onSelectEstimate?.(est.id)}
              className={`
                bg-white rounded-xl p-3 border border-amber-100
                ${onSelectEstimate ? 'cursor-pointer hover:border-amber-300 hover:shadow-sm transition-all' : ''}
              `}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 truncate">
                      {est.estimateNumber}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(
                        est.status
                      )}`}
                    >
                      {est.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {formatDate(new Date(est.createdAt))}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {SHINGLE_TYPE_NAMES[est.shingleType]}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-600">
                    {formatCurrency(getEstimateTotal(est))}
                  </div>
                  {est.photos.length > 0 && (
                    <div className="text-xs text-gray-400 mt-1">
                      {est.photos.length} photo{est.photos.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>

              {/* Photo thumbnails */}
              {est.photos.length > 0 && (
                <div className="flex gap-1 mt-2 overflow-x-auto">
                  {est.photos.slice(0, 4).map((photo) => (
                    <img
                      key={photo.id}
                      src={photo.dataUrl}
                      alt="Previous repair"
                      className="w-10 h-10 rounded object-cover flex-shrink-0"
                    />
                  ))}
                  {est.photos.length > 4 && (
                    <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
                      +{est.photos.length - 4}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
