"use client";

import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-6">
          <div className="bg-[var(--color-card-bg)] p-8 rounded-2xl shadow-lg border border-[var(--color-card-border)] max-w-md w-full text-center animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-danger-50 mb-4">
              <AlertTriangle className="text-danger-500" size={40} />
            </div>
            <h1 className="text-2xl font-extrabold text-[var(--color-fg)] mb-2">
              حدث خطأ غير متوقع
            </h1>
            <p className="text-sm text-[var(--color-neutral-500)] mb-4">
              عذراً، حدث خطأ أثناء تحميل هذه الصفحة.
            </p>
            {this.state.error && (
              <details className="text-left bg-[var(--color-bg)] p-3 rounded-xl mb-4 text-xs">
                <summary className="cursor-pointer font-bold text-[var(--color-neutral-600)]">
                  تفاصيل الخطأ
                </summary>
                <pre className="mt-2 text-danger-600 overflow-x-auto whitespace-pre-wrap break-all">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-2">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-primary-500 text-white font-bold py-3 rounded-xl hover:bg-primary-600 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} /> إعادة المحاولة
              </button>
              <Link
                href="/admin/dashboard"
                className="flex-1 bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)] font-bold py-3 rounded-xl hover:bg-[var(--color-neutral-200)] transition-all flex items-center justify-center gap-2"
              >
                <Home size={18} /> الرئيسية
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}