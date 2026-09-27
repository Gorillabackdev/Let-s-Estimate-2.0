import React, { useState, useEffect, useRef } from 'react';
import { formatNumber, parseFormattedNumber } from '../../utils/format';

export interface FormattedNumberInputProps {
  id?: string;
  value: number | string | undefined | null;
  onChange: (value: number) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  min?: number;
  max?: number;
  step?: number | string;
  disabled?: boolean;
  prefix?: string;
  suffix?: string;
  maxDecimals?: number;
  title?: string;
  autoFocus?: boolean;
  required?: boolean;
}

/**
 * High-precision numeric input with thousands-separator commas and effortless deletion:
 * - Automatically selects all text on click or focus so typing immediately replaces existing numbers
 * - Deleting all numbers (Backspace or Delete) cleanly clears the field without leaving a stuck "0"
 * - Hides the "0" placeholder while focused so users never encounter a ghost digit they can't delete
 * - Displays clean, unformatted numbers while editing to prevent cursor jumping or comma interference
 * - Automatically formats with standard commas upon blur
 */
export const FormattedNumberInput: React.FC<FormattedNumberInputProps> = ({
  id,
  value,
  onChange,
  onBlur,
  placeholder = '0',
  className = '',
  disabled = false,
  maxDecimals = 2,
  title,
  autoFocus,
  required,
}) => {
  const numericValue = parseFormattedNumber(value);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial formatted representation when not editing
  const [localText, setLocalText] = useState<string>(() => {
    return numericValue === 0 ? '' : formatNumber(numericValue, maxDecimals);
  });

  // Keep display synchronized when parent state updates and the user is NOT actively typing
  useEffect(() => {
    if (!isFocused) {
      setLocalText(numericValue === 0 ? '' : formatNumber(numericValue, maxDecimals));
    }
  }, [numericValue, isFocused, maxDecimals]);

  const moveCursorToEnd = () => {
    if (inputRef.current) {
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    // When editing, show raw digits without commas so cursor movement and backspacing are smooth
    const initialText = numericValue === 0 ? '' : String(numericValue);
    setLocalText(initialText);

    // Place cursor at the end so typing or backspacing immediately affects the numbers
    requestAnimationFrame(() => {
      moveCursorToEnd();
    });
  };

  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    if (!inputRef.current) return;
    // In text-right inputs, clicking empty space to the left puts cursor at 0.
    // Automatically move cursor to the end so backspace works immediately without having to manually move cursor behind numbers.
    if (inputRef.current.selectionStart === 0 && inputRef.current.selectionEnd === 0 && inputRef.current.value.length > 0) {
      moveCursorToEnd();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const clean = raw.replace(/,/g, '').trim();

    // If user deleted all characters or is typing initial signs
    if (clean === '' || clean === '-' || clean === '.') {
      setLocalText(clean);
      onChange(0);
      return;
    }

    // Allow decimal and numeric characters
    if (/^-?\d*\.?\d*$/.test(clean)) {
      setLocalText(clean);
      const parsed = parseFloat(clean);
      if (!isNaN(parsed)) {
        onChange(parsed);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If user presses Backspace or Delete
    if (e.key === 'Backspace' || e.key === 'Delete') {
      // 1. If field already empty or just '0'
      if (localText === '0' || localText === '') {
        e.preventDefault();
        setLocalText('');
        onChange(0);
        return;
      }

      // 2. If user presses Backspace while cursor is at position 0 (start of numbers):
      // Cleanly clear all numbers instead of doing nothing!
      if (inputRef.current && e.key === 'Backspace') {
        const { selectionStart, selectionEnd } = inputRef.current;
        if (selectionStart === 0 && selectionEnd === 0 && localText.length > 0) {
          e.preventDefault();
          setLocalText('');
          onChange(0);
          return;
        }
      }
    }

    // Escape clears field
    if (e.key === 'Escape') {
      e.preventDefault();
      setLocalText('');
      onChange(0);
      return;
    }

    // Submit / blur on Enter
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  const handleBlur = () => {
    setIsFocused(false);

    const clean = localText.replace(/,/g, '').trim();
    const parsed = parseFloat(clean);

    if (isNaN(parsed) || parsed === 0) {
      setLocalText('');
      onChange(0);
    } else {
      setLocalText(formatNumber(parsed, maxDecimals));
      onChange(parsed);
    }

    if (onBlur) {
      onBlur();
    }
  };

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      inputMode="decimal"
      value={localText}
      onChange={handleChange}
      onFocus={handleFocus}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      // Hiding placeholder while focused ensures no ghost "0" appears when text is cleared
      placeholder={isFocused ? '' : placeholder}
      className={className}
      disabled={disabled}
      title={title}
      autoFocus={autoFocus}
      required={required}
    />
  );
};
