import React, { useState, useEffect } from 'react';
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
 * High-precision numeric input with thousands-separator commas.
 * - Displays figures formatted with commas (e.g. 1,500,000) for instant differentiation
 * - Allows typing numbers with or without commas
 * - Supports clean backspacing/deletion without cursor jumps or snapping
 * - Automatically formats with commas on blur
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
  const [localText, setLocalText] = useState<string>(() => {
    return numericValue === 0 ? '' : formatNumber(numericValue, maxDecimals);
  });

  // Keep display synchronized when parent state updates and user is not actively typing
  useEffect(() => {
    if (!isFocused) {
      setLocalText(numericValue === 0 ? '' : formatNumber(numericValue, maxDecimals));
    }
  }, [numericValue, isFocused, maxDecimals]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (numericValue === 0) {
      setLocalText('');
    } else {
      // Keep existing formatted or raw text for convenient editing
      setLocalText(formatNumber(numericValue, maxDecimals));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow empty string, digits, commas, and a single decimal point
    const clean = raw.replace(/,/g, '').trim();

    if (clean === '' || clean === '-' || clean === '.') {
      setLocalText(raw);
      onChange(0);
      return;
    }

    if (/^-?\d*\.?\d*$/.test(clean)) {
      setLocalText(raw);
      const parsed = parseFloat(clean);
      if (!isNaN(parsed)) {
        onChange(parsed);
      }
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
      id={id}
      type="text"
      inputMode="decimal"
      value={localText}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      title={title}
      autoFocus={autoFocus}
      required={required}
    />
  );
};
