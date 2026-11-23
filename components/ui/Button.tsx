"use client";

import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "success" | "danger" | "warning" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  onClick,
  type = "button",
}: ButtonProps) {
  const variants = {
    primary: "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-sm shadow-primary-200",
    success: "bg-success-400 text-white hover:bg-success-500 active:bg-success-600 shadow-sm shadow-success-200",
    danger: "bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700 shadow-sm shadow-danger-200",
    warning: "bg-warning-500 text-white hover:opacity-90 active:opacity-80 shadow-sm",
    ghost: "bg-transparent text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-100)]",
    outline: "bg-[var(--color-card-bg)] border-2 border-[var(--color-neutral-200)] text-[var(--color-neutral-700)] hover:border-primary-300 hover:text-primary-600",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-bold rounded-xl
        transition-all duration-200 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-[0.97]
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}