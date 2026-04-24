import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';

interface ScoreInputProps {
  initialValue: number | null;
  onCommit: (value: number) => void;
  className?: string;
  tabIndex?: number;
}

export const ScoreInput: React.FC<ScoreInputProps> = ({ initialValue, onCommit, className, tabIndex }) => {
  const [localValue, setLocalValue] = useState<string>((initialValue ?? 0).toFixed(1));

  useEffect(() => {
    setLocalValue((initialValue ?? 0).toFixed(1));
  }, [initialValue]);

  const debouncedCommit = useCallback(
    debounce((val: number) => {
      onCommit(val);
    }, 300),
    [onCommit]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Replace comma with dot for localization support
    let rawValue = e.target.value.replace(',', '.');
    
    // Allow empty string or a number with up to one decimal point
    if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
      setLocalValue(rawValue);
      const numValue = parseFloat(rawValue);
      if (!isNaN(numValue)) {
        debouncedCommit(numValue);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    let currentValue = parseFloat(localValue);
    if (isNaN(currentValue)) currentValue = 0;

    const step = e.shiftKey ? 1.0 : 0.1;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newValue = Math.min(10, currentValue + step);
      const fixedValue = parseFloat(newValue.toFixed(1));
      setLocalValue(fixedValue.toFixed(1));
      debouncedCommit(fixedValue);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newValue = Math.max(0, currentValue - step);
      const fixedValue = parseFloat(newValue.toFixed(1));
      setLocalValue(fixedValue.toFixed(1));
      debouncedCommit(fixedValue);
    } 
    // Tab behavior is handled natively by the browser if tabIndex is correct.
    // We don't need to manually handle it unless we want specific custom logic.
    // Removing the custom Tab handler to allow natural flow.
    else if (e.key === 'Enter') {
       e.preventDefault();
       const form = (e.target as HTMLInputElement).form;
       if (form) {
         const focusable = Array.from(form.querySelectorAll('input, button, select, textarea')).filter(
           (el) => !el.hasAttribute('disabled')
         );
         const index = focusable.indexOf(e.target as HTMLElement);
         if (index > -1) {
           const nextElement = focusable[index + 1] as HTMLElement;
           if (nextElement) {
             nextElement.focus();
           }
         }
       }
    }
  };

  const handleBlur = () => {
    const numValue = parseFloat(localValue);
    const finalValue = isNaN(numValue) ? 0 : Math.max(0, Math.min(10, numValue));
    setLocalValue(finalValue.toFixed(1)); // Ensure UI reflects the valid value
    debouncedCommit(finalValue);
    debouncedCommit.flush(); // Ensure commit on blur
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={localValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      onFocus={(e) => e.target.select()}
      tabIndex={tabIndex}
      className={className || 'w-24 p-2 border border-slate-600 rounded-md bg-slate-900/50 text-white text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner'}
    />
  );
};
