import React from 'react';

interface NumberInputProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  showStepper?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function NumberInput({
  label,
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
  unit,
  showStepper = true,
  size = 'md',
}: NumberInputProps) {
  const handleIncrement = () => {
    const newValue = Math.min(value + step, max);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(value - step, min);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value) || 0;
    onChange(Math.max(min, Math.min(max, newValue)));
  };

  const sizeStyles = {
    sm: {
      button: 'w-10 h-10 text-lg',
      input: 'w-16 h-10 text-sm',
      wrapper: 'gap-1',
    },
    md: {
      button: 'w-12 h-12 text-xl',
      input: 'w-20 h-12 text-base',
      wrapper: 'gap-2',
    },
    lg: {
      button: 'w-14 h-14 text-2xl',
      input: 'w-24 h-14 text-lg',
      wrapper: 'gap-2',
    },
  };

  const styles = sizeStyles[size];

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}
      <div className={`flex items-center ${styles.wrapper}`}>
        {showStepper && (
          <button
            type="button"
            onClick={handleDecrement}
            disabled={value <= min}
            className={`
              ${styles.button} flex items-center justify-center
              bg-gray-100 hover:bg-gray-200 active:bg-gray-300
              rounded-lg font-bold text-gray-700
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors touch-target
            `}
            aria-label="Decrease"
          >
            −
          </button>
        )}
        <div className="relative">
          <input
            type="number"
            value={value}
            onChange={handleInputChange}
            min={min}
            max={max}
            step={step}
            className={`
              ${styles.input} text-center border border-gray-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
            `}
          />
          {unit && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">
              {unit}
            </span>
          )}
        </div>
        {showStepper && (
          <button
            type="button"
            onClick={handleIncrement}
            disabled={value >= max}
            className={`
              ${styles.button} flex items-center justify-center
              bg-blue-100 hover:bg-blue-200 active:bg-blue-300
              rounded-lg font-bold text-blue-700
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors touch-target
            `}
            aria-label="Increase"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}

// Compact inline version for lists
interface InlineNumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function InlineNumberInput({
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
}: InlineNumberInputProps) {
  const handleIncrement = () => {
    onChange(Math.min(value + step, max));
  };

  const handleDecrement = () => {
    onChange(Math.max(value - step, min));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value) || 0;
    onChange(Math.max(min, Math.min(max, newValue)));
  };

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={handleDecrement}
        disabled={value <= min}
        className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-bold disabled:opacity-50 touch-target"
        aria-label="Decrease"
      >
        −
      </button>
      <input
        type="number"
        value={value}
        onChange={handleInputChange}
        min={min}
        max={max}
        step={step}
        className="w-14 h-8 text-center border border-gray-300 rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={handleIncrement}
        disabled={value >= max}
        className="w-8 h-8 flex items-center justify-center bg-blue-100 hover:bg-blue-200 rounded text-blue-700 font-bold disabled:opacity-50 touch-target"
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}
