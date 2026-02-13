interface QuickIncrementButtonsProps {
  value: number;
  onChange: (value: number) => void;
  increments?: number[];
  min?: number;
  max?: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function QuickIncrementButtons({
  value,
  onChange,
  increments = [1, 5, 10],
  min = 0,
  max = 999,
  label,
  size = 'md',
}: QuickIncrementButtonsProps) {
  const handleIncrement = (amount: number) => {
    const newValue = Math.min(max, Math.max(min, value + amount));
    onChange(newValue);
  };

  const handleDecrement = (amount: number) => {
    const newValue = Math.min(max, Math.max(min, value - amount));
    onChange(newValue);
  };

  const sizeClasses = {
    sm: 'h-10 px-3 text-sm',
    md: 'h-14 px-4 text-base',
    lg: 'h-16 px-5 text-lg',
  };

  const counterSizeClasses = {
    sm: 'text-2xl w-16',
    md: 'text-3xl w-20',
    lg: 'text-4xl w-24',
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-600">{label}</label>
      )}
      <div className="flex items-center gap-2">
        {/* Decrement buttons */}
        <div className="flex gap-1">
          {[...increments].reverse().map((inc) => (
            <button
              key={`dec-${inc}`}
              type="button"
              onClick={() => handleDecrement(inc)}
              disabled={value <= min}
              className={`
                ${sizeClasses[size]}
                bg-gradient-to-b from-red-500 to-red-600 text-white font-bold
                rounded-xl shadow-md
                active:scale-95 active:shadow-sm
                disabled:opacity-40 disabled:active:scale-100
                transition-all duration-100
                touch-manipulation
              `}
            >
              -{inc}
            </button>
          ))}
        </div>

        {/* Current value */}
        <div
          className={`
            ${counterSizeClasses[size]}
            bg-gradient-to-b from-gray-100 to-gray-200
            rounded-xl font-bold text-gray-800
            flex items-center justify-center
            shadow-inner border border-gray-300
          `}
        >
          {value}
        </div>

        {/* Increment buttons */}
        <div className="flex gap-1">
          {increments.map((inc) => (
            <button
              key={`inc-${inc}`}
              type="button"
              onClick={() => handleIncrement(inc)}
              disabled={value >= max}
              className={`
                ${sizeClasses[size]}
                bg-gradient-to-b from-green-500 to-green-600 text-white font-bold
                rounded-xl shadow-md
                active:scale-95 active:shadow-sm
                disabled:opacity-40 disabled:active:scale-100
                transition-all duration-100
                touch-manipulation
              `}
            >
              +{inc}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
