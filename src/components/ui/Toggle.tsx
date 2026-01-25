
interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: ToggleProps) {
  return (
    <label
      className={`
        flex items-center justify-between p-4 rounded-lg border cursor-pointer touch-target
        ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'hover:bg-gray-50'}
        ${checked ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
      `}
    >
      <div className="flex-1 pr-4">
        <div className={`font-medium ${disabled ? 'text-gray-400' : 'text-gray-900'}`}>
          {label}
        </div>
        {description && (
          <div className={`mt-1 text-sm ${disabled ? 'text-gray-300' : 'text-gray-500'}`}>
            {description}
          </div>
        )}
      </div>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div
          className={`
            w-14 h-8 rounded-full transition-colors
            ${checked ? 'bg-blue-600' : 'bg-gray-300'}
            ${disabled ? 'opacity-50' : ''}
          `}
        />
        <div
          className={`
            absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform
            ${checked ? 'translate-x-6' : 'translate-x-0'}
          `}
        />
      </div>
    </label>
  );
}

// Checkbox style toggle for lists
interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Checkbox({ label, checked, onChange, disabled = false }: CheckboxProps) {
  return (
    <label
      className={`
        flex items-center gap-3 p-3 rounded-lg cursor-pointer touch-target
        ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'hover:bg-gray-50'}
      `}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
      <span className={`${disabled ? 'text-gray-400' : 'text-gray-900'}`}>{label}</span>
    </label>
  );
}
