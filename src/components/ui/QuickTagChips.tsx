import type { QuickDamageTag } from '../../types';
import { TAG_CATEGORIES } from '../../data/quickDamageTags';

interface QuickTagChipsProps {
  tags: QuickDamageTag[];
  selectedIds: string[];
  onToggle: (tagId: string) => void;
  showCategories?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const CATEGORY_COLORS = {
  penetration: {
    active: 'bg-blue-500 text-white border-blue-600',
    inactive: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  },
  flashing: {
    active: 'bg-amber-500 text-white border-amber-600',
    inactive: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  },
  ventilation: {
    active: 'bg-green-500 text-white border-green-600',
    inactive: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
  },
  sealant: {
    active: 'bg-purple-500 text-white border-purple-600',
    inactive: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
  },
  structural: {
    active: 'bg-red-500 text-white border-red-600',
    inactive: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
  },
};

export function QuickTagChips({
  tags,
  selectedIds,
  onToggle,
  showCategories = false,
  size = 'md',
}: QuickTagChipsProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-base',
  };

  // Group by category if needed
  const groupedTags = showCategories
    ? Object.entries(TAG_CATEGORIES).map(([category, meta]) => ({
        category,
        label: meta.label,
        tags: tags.filter((t) => t.category === category),
      }))
    : [{ category: 'all', label: '', tags }];

  return (
    <div className="space-y-4">
      {groupedTags.map(
        (group) =>
          group.tags.length > 0 && (
            <div key={group.category}>
              {showCategories && group.label && (
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  {group.label}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {group.tags.map((tag) => {
                  const isSelected = selectedIds.includes(tag.id);
                  const colors = CATEGORY_COLORS[tag.category];

                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => onToggle(tag.id)}
                      className={`
                        ${sizeClasses[size]}
                        ${isSelected ? colors.active : colors.inactive}
                        inline-flex items-center gap-1.5
                        font-medium rounded-2xl border-2
                        transition-all duration-150
                        active:scale-95
                        touch-manipulation
                        ${isSelected ? 'shadow-md' : 'shadow-sm'}
                      `}
                    >
                      <span className="text-lg leading-none">{tag.icon}</span>
                      <span>{tag.label}</span>
                      {isSelected && (
                        <svg
                          className="w-4 h-4 ml-0.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )
      )}
    </div>
  );
}

// Compact version for inline use
interface CompactTagProps {
  tag: QuickDamageTag;
  isSelected: boolean;
  onToggle: () => void;
}

export function CompactTag({ tag, isSelected, onToggle }: CompactTagProps) {
  const colors = CATEGORY_COLORS[tag.category];

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`
        ${isSelected ? colors.active : colors.inactive}
        inline-flex items-center gap-1 px-2.5 py-1
        text-xs font-medium rounded-full border
        transition-all duration-150 active:scale-95
      `}
    >
      <span>{tag.icon}</span>
      <span>{tag.label}</span>
    </button>
  );
}
