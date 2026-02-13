interface FieldModeToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function FieldModeToggle({ enabled, onChange }: FieldModeToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`
        flex items-center gap-3 px-4 py-2 rounded-2xl font-medium
        transition-all duration-200 touch-manipulation
        ${
          enabled
            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }
      `}
    >
      <div
        className={`
          w-6 h-6 rounded-full flex items-center justify-center
          transition-all duration-200
          ${enabled ? 'bg-white/30' : 'bg-gray-300'}
        `}
      >
        {enabled ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        )}
      </div>
      <span className="text-sm">
        {enabled ? 'FIELD MODE' : 'Field Mode'}
      </span>
    </button>
  );
}
