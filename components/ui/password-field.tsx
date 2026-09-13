'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Field } from '@/components/ui/field';

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  placeholder?: string;
  hint?: string;
  autoFocus?: boolean;
  minLength?: number;
  required?: boolean;
}

export default function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  hint,
  autoFocus,
  minLength,
  required = true,
}: PasswordFieldProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <Field label={label} hint={hint}>
      <div className="relative">
        <input
          type={revealed ? 'text' : 'password'}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          className="field-field w-full pr-10"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          minLength={minLength}
        />
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-ink-mute hover:text-ink transition-colors"
          aria-label={revealed ? 'Hide password' : 'Show password'}
          aria-pressed={revealed}
        >
          {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </Field>
  );
}