import { formatCurrency } from '../../utils/calculateEstimate';

interface StickyTotalBarProps {
  total: number;
  itemCount: number;
  label?: string;
  onViewDetails?: () => void;
}

export function StickyTotalBar({
  total,
  itemCount,
  label = 'Running Total',
  onViewDetails,
}: StickyTotalBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-2xl border-t border-blue-500">
      <div className="max-w-3xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-lg font-bold">{itemCount}</span>
            </div>
            <div>
              <div className="text-xs text-blue-200 uppercase tracking-wide">{label}</div>
              <div className="text-2xl font-bold tracking-tight">
                {formatCurrency(total)}
              </div>
            </div>
          </div>
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors"
            >
              View Details
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
