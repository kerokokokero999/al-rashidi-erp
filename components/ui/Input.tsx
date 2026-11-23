"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-2.5 rounded-xl border-2 
            ${error ? "border-danger-500 focus:border-danger-600" : "border-[var(--color-neutral-200)] focus:border-primary-400"}
            bg-[var(--color-card-bg)] text-[var(--color-fg)] placeholder:text-[var(--color-neutral-400)]
            focus:outline-none focus:ring-4 
            ${error ? "focus:ring-danger-100" : "focus:ring-primary-100"}
            transition-all duration-200
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-xs text-danger-600 mt-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export default Input;