"use client";

import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({ children, className = "", hover = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)]
        transition-all duration-300
        ${hover ? "hover:shadow-lg hover:border-primary-200 hover:-translate-y-0.5 cursor-pointer" : ""}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}