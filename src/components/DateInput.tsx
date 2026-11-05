import React, { useRef } from 'react';
import { Calendar } from 'lucide-react';
import { formatDateDMY } from '../lib/dateFormat';

interface DateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Universal Date Input that always displays Day > Month > Year (DD/MM/YYYY)
 * regardless of the browser's OS locale, while preserving native calendar picker popup
 * and standard YYYY-MM-DD value binding.
 */
export default function DateInput({
  value = '',
  onChange,
  className = '',
  placeholder = 'DD/MM/YYYY',
  required,
  disabled,
  min,
  max,
  ...rest
}: DateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const formattedDisplay = value ? formatDateDMY(String(value)) : placeholder;

  const handleContainerClick = () => {
    if (disabled) return;
    if (inputRef.current) {
      try {
        if (typeof (inputRef.current as any).showPicker === 'function') {
          (inputRef.current as any).showPicker();
        } else {
          inputRef.current.focus();
        }
      } catch {
        inputRef.current.focus();
      }
    }
  };

  return (
    <div
      onClick={handleContainerClick}
      className={`relative flex items-center justify-between cursor-pointer select-none ${className}`}
    >
      <span className={`truncate ${value ? '' : 'text-slate-400 font-normal'}`}>
        {formattedDisplay}
      </span>
      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2 pointer-events-none" />
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        onClick={(e) => {
          e.stopPropagation();
          try {
            if (typeof (e.currentTarget as any).showPicker === 'function') {
              (e.currentTarget as any).showPicker();
            }
          } catch {}
        }}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        {...rest}
      />
    </div>
  );
}
