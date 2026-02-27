import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import { forwardRef } from 'react';

// Input
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-3 py-2 rounded-lg border border-border
            bg-bg-card text-text-primary placeholder:text-text-muted
            focus:outline-none focus:ring-2 focus:ring-accent-sage focus:border-transparent
            disabled:bg-bg-secondary disabled:cursor-not-allowed
            ${error ? 'border-accent-rust' : ''}
            ${className}
          `}
          {...props}
        />
        {hint && !error && (
          <p className="text-xs text-text-muted">{hint}</p>
        )}
        {error && (
          <p className="text-xs text-accent-rust">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full px-3 py-2 rounded-lg border border-border
            bg-bg-card text-text-primary placeholder:text-text-muted
            focus:outline-none focus:ring-2 focus:ring-accent-sage focus:border-transparent
            disabled:bg-bg-secondary disabled:cursor-not-allowed
            resize-y min-h-[100px]
            ${error ? 'border-accent-rust' : ''}
            ${className}
          `}
          {...props}
        />
        {hint && !error && (
          <p className="text-xs text-text-muted">{hint}</p>
        )}
        {error && (
          <p className="text-xs text-accent-rust">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// Select
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`
            w-full px-3 py-2 rounded-lg border border-border
            bg-bg-card text-text-primary
            focus:outline-none focus:ring-2 focus:ring-accent-sage focus:border-transparent
            disabled:bg-bg-secondary disabled:cursor-not-allowed
            ${error ? 'border-accent-rust' : ''}
            ${className}
          `}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-xs text-accent-rust">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

// Checkbox
interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <label className={`flex items-center gap-2 cursor-pointer ${className}`}>
        <input
          ref={ref}
          type="checkbox"
          className="
            w-4 h-4 rounded border-border text-accent-sage
            focus:ring-2 focus:ring-accent-sage focus:ring-offset-2
            cursor-pointer
          "
          {...props}
        />
        <span className="text-sm text-text-primary">{label}</span>
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

// File Input
interface FileInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  hint?: string;
  accept?: string;
  onFileSelect?: (file: File) => void;
}

export function FileInput({ label, hint, accept, onFileSelect, className = '', ...props }: FileInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
  };

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <div
        className={`
          relative border-2 border-dashed border-border rounded-lg p-6
          hover:border-accent-sage transition-colors cursor-pointer
          bg-bg-card
          ${className}
        `}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          {...props}
        />
        <div className="text-center">
          <svg
            className="mx-auto h-10 w-10 text-text-muted"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="mt-2 text-sm text-text-secondary">
            Click to upload or drag and drop
          </p>
          {hint && (
            <p className="mt-1 text-xs text-text-muted">{hint}</p>
          )}
        </div>
      </div>
    </div>
  );
}
