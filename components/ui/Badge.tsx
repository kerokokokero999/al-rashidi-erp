"use client";

import { ReactNode } from "react";

type BadgeVariant = "primary" | "success" | "danger" | "warning" | "neutral" | "info";

export default function Badge({
  children,
  variant = "neutral",
}: {
  children: ReactNode;
  variant?: BadgeVariant;
}) {
  const variants = {
    primary: "bg-primary-100 text-primary-700",
    success: "bg-success-100 text-success-700",
    danger: "bg-danger-50 text-danger-700",
    warning: "bg-orange-100 text-orange-700",
    neutral: "bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)]",
    info: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${variants[variant]}`}>
      {children}
    </span>
  );
}