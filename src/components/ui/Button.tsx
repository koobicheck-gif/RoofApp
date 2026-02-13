import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = `
    font-semibold rounded-xl transition-all duration-200
    touch-target flex items-center justify-center gap-2
    active:scale-[0.98] shadow-sm hover:shadow-md
    disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
  `;

  const variantStyles = {
    primary: `
      bg-gradient-to-b from-blue-500 to-blue-600 text-white
      hover:from-blue-600 hover:to-blue-700
      shadow-blue-500/25 hover:shadow-blue-500/40
    `,
    secondary: `
      bg-gradient-to-b from-gray-500 to-gray-600 text-white
      hover:from-gray-600 hover:to-gray-700
    `,
    outline: `
      border-2 border-blue-500 text-blue-600 bg-white
      hover:bg-blue-50 hover:border-blue-600
      shadow-none hover:shadow-sm
    `,
    danger: `
      bg-gradient-to-b from-red-500 to-red-600 text-white
      hover:from-red-600 hover:to-red-700
      shadow-red-500/25 hover:shadow-red-500/40
    `,
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm min-h-[40px]',
    md: 'px-5 py-3 text-base min-h-[48px]',
    lg: 'px-6 py-4 text-lg min-h-[56px]',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
