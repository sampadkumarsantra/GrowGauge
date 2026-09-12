import React from 'react';
import clsx from 'clsx';

export type ButtonVariant = 'primary' | 'quiet' | 'link';

export function buttonClass(variant: ButtonVariant = 'quiet', extra?: string): string {
  return clsx(
    'btn',
    variant === 'primary' && 'btn-primary',
    variant === 'quiet' && 'btn-quiet',
    variant === 'link' && 'btn-link',
    extra
  );
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = 'quiet', className, ...props }: ButtonProps) {
  return <button {...props} className={buttonClass(variant, className)} />;
}