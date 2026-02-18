import { formatCurrency } from '../../utils/calculateEstimate';

interface StickyTotalBarProps {
  total: number;
  itemCount: number;
  label?: string;
  onViewDetails?: () => void;
  onNext?: () => void;
  nextLabel?: string;
}

export function StickyTotalBar({
  total,
  itemCount,
  label = 'Running Total',
  onViewDetails,
  onNext,
  nextLabel = 'Next',
}: StickyTotalBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-[#00224a] to-[#001a3a] text-white shadow-2xl border-t border-[#00224a]/50">
      <div className="max-w-3xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-lg font-bold">{itemCount}</span>
            </div>
            <div>
              <div className="text-xs text-white/70 uppercase tracking-wide">{label}</div>
              <div className="text-2xl font-bold tracking-tight">
                {formatCurrency(total)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onViewDetails && (
              <button
                onClick={onViewDetails}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors"
              >
                View Details
              </button>
            )}
            {onNext && (
              <button
                onClick={onNext}
                className="px-5 py-2.5 bg-white text-[#00224a] hover:bg-white/90 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
              >
                {nextLabel}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
