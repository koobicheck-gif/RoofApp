import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'gradient' | 'outlined';
  onClick?: () => void;
}

export function Card({
  children,
  className = '',
  padding = 'md',
  variant = 'default',
  onClick,
}: CardProps) {
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-6',
  };

  const variantStyles = {
    default: 'bg-white border border-gray-100 shadow-sm hover:shadow-md',
    gradient: 'bg-gradient-to-br from-white to-gray-50 border border-gray-100 shadow-md',
    outlined: 'bg-white border-2 border-gray-200',
  };

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`
        rounded-2xl transition-shadow duration-200
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${onClick ? 'w-full text-left active:scale-[0.99] cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </Component>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
