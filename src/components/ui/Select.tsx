import React from 'react';

interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helpText?: string;
  onChange?: (value: string) => void;
}

export function Select({
  label,
  options,
  error,
  helpText,
  className = '',
  id,
  onChange,
  required,
  ...props
}: SelectProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const errorId = error ? `${inputId}-error` : undefined;
  const helpId = helpText && !error ? `${inputId}-help` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(' ') || undefined;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      <select
        id={inputId}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        aria-required={required}
        className={`
          w-full px-4 py-3 text-base border rounded-lg touch-target appearance-none
          bg-white bg-no-repeat bg-right
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}
          focus:outline-none focus:ring-2 focus:border-transparent
          disabled:bg-gray-100 disabled:text-gray-500
          ${className}
        `}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundSize: '24px',
          backgroundPosition: 'right 12px center',
          paddingRight: '48px',
        }}
        onChange={handleChange}
        required={required}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helpText && !error && (
        <p id={helpId} className="text-sm text-gray-500">{helpText}</p>
      )}
      {error && <p id={errorId} className="text-sm text-red-600" role="alert">{error}</p>}
    </div>
  );
}

// Card-style select for visual options (like shingle types, pitch, etc.)
interface CardSelectProps {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  columns?: 1 | 2 | 3;
}

export function CardSelect({ label, options, value, onChange, columns = 1 }: CardSelectProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  };

  const groupId = label?.toLowerCase().replace(/\s+/g, '-') || 'card-select';

  return (
    <div className="space-y-2" role="radiogroup" aria-labelledby={label ? `${groupId}-label` : undefined}>
      {label && (
        <label id={`${groupId}-label`} className="block text-sm font-medium text-gray-700">{label}</label>
      )}
      <div className={`grid gap-3 ${gridCols[columns]}`}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            onClick={() => onChange(option.value)}
            className={`
              p-4 text-left border-2 rounded-lg transition-all touch-target
              ${
                value === option.value
                  ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            <div className="font-medium text-gray-900">{option.label}</div>
            {option.description && (
              <div className="mt-1 text-sm text-gray-500">{option.description}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
