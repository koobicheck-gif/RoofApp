import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export function Input({
  label,
  error,
  helpText,
  className = '',
  id,
  required,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const errorId = error ? `${inputId}-error` : undefined;
  const helpId = helpText && !error ? `${inputId}-help` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        aria-required={required}
        className={`
          w-full px-4 py-3 text-base border rounded-lg touch-target
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}
          focus:outline-none focus:ring-2 focus:border-transparent
          disabled:bg-gray-100 disabled:text-gray-500
          ${className}
        `}
        required={required}
        {...props}
      />
      {helpText && !error && (
        <p id={helpId} className="text-sm text-gray-500">{helpText}</p>
      )}
      {error && <p id={errorId} className="text-sm text-red-600" role="alert">{error}</p>}
    </div>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export function TextArea({
  label,
  error,
  helpText,
  className = '',
  id,
  required,
  ...props
}: TextAreaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const errorId = error ? `${inputId}-error` : undefined;
  const helpId = helpText && !error ? `${inputId}-help` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        aria-required={required}
        className={`
          w-full px-4 py-3 text-base border rounded-lg
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}
          focus:outline-none focus:ring-2 focus:border-transparent
          disabled:bg-gray-100 disabled:text-gray-500
          ${className}
        `}
        required={required}
        {...props}
      />
      {helpText && !error && (
        <p id={helpId} className="text-sm text-gray-500">{helpText}</p>
      )}
      {error && <p id={errorId} className="text-sm text-red-600" role="alert">{error}</p>}
    </div>
  );
}
