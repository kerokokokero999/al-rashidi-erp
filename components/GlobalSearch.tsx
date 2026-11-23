"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Package, Users, Truck, ReceiptText, Loader2, X } from "lucide-react";

type SearchResult = {
  type: "product" | "customer" | "supplier" | "invoice";
  id: number;
  title: string;
  subtitle: string;
  href: string;
};

const typeConfig = {
  product: { icon: Package, color: "text-primary-600", bg: "bg-primary-100", label: "منتج" },
  customer: { icon: Users, color: "text-info-500", bg: "bg-info-500/10", label: "عميل" },
  supplier: { icon: Truck, color: "text-orange-600", bg: "bg-orange-100", label: "مورد" },
  invoice: { icon: ReceiptText, color: "text-success-600", bg: "bg-success-100", label: "فاتورة" },
};

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [fetchedResults, setFetchedResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // ✅ derived state — لو query أقل من 2 حرف، مفيش نتائج
  const results = query.trim().length < 2 ? [] : fetchedResults;

  // Ctrl+K / Cmd+K لفتح البحث
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        setQuery("");
        setFetchedResults([]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) return;

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setFetchedResults(data.results);
          setSelectedIndex(0);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSelect = (result: SearchResult) => {
    router.push(result.href);
    setIsOpen(false);
    setQuery("");
    setFetchedResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  const closeSearch = () => {
    setIsOpen(false);
    setQuery("");
    setFetchedResults([]);
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-2 bg-[var(--color-neutral-100)] hover:bg-neutral-200 transition-colors px-3 py-2 rounded-xl text-sm text-[var(--color-neutral-500)]"
        title="بحث سريع (Ctrl+K)"
      >
        <Search size={16} />
        <span>بحث...</span>
        <kbd className="bg-[var(--color-card-bg)] px-1.5 py-0.5 rounded border border-neutral-300 text-[10px] font-mono">
          Ctrl K
        </kbd>
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-start justify-center z-[100] pt-20 px-4 animate-fade-in"
          onClick={closeSearch}
        >
          <div
            className="bg-[var(--color-card-bg)] rounded-2xl shadow-2xl w-full max-w-xl animate-scale-in overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 p-4 border-b border-[var(--color-card-border)]">
              {loading ? (
                <Loader2 size={20} className="text-primary-500 animate-spin" />
              ) : (
                <Search size={20} className="text-[var(--color-neutral-400)]" />
              )}
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="ابحث عن منتج، عميل، مورد، فاتورة..."
                className="flex-1 outline-none text-base text-[var(--color-fg)] placeholder:text-[var(--color-neutral-400)]"
              />
              <button
                onClick={closeSearch}
                className="p-1.5 rounded-lg text-[var(--color-neutral-400)] hover:text-danger-600 hover:bg-danger-50 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {query.length < 2 ? (
                <div className="p-8 text-center text-[var(--color-neutral-400)] text-sm">
                  اكتب حرفين على الأقل للبحث...
                </div>
              ) : loading ? (
                <div className="p-8 text-center text-[var(--color-neutral-400)] text-sm">
                  جاري البحث...
                </div>
              ) : results.length === 0 ? (
                <div className="p-8 text-center text-[var(--color-neutral-400)] text-sm">
                  لا توجد نتائج لـ &quot;{query}&quot;
                </div>
              ) : (
                <div className="p-2">
                  {results.map((result, idx) => {
                    const config = typeConfig[result.type];
                    const Icon = config.icon;
                    return (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleSelect(result)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-right transition-colors ${
                          selectedIndex === idx
                            ? "bg-primary-50 border border-primary-200"
                            : "hover:bg-[var(--color-bg)] border border-transparent"
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${config.bg} ${config.color}`}>
                          <Icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-[var(--color-fg)] truncate">
                            {result.title}
                          </div>
                          <div className="text-xs text-[var(--color-neutral-500)] truncate">
                            {result.subtitle}
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded ${config.bg} ${config.color} font-bold`}>
                          {config.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-[var(--color-card-border)] bg-[var(--color-bg)] flex items-center justify-between text-xs text-[var(--color-neutral-500)]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="bg-[var(--color-card-bg)] px-1.5 py-0.5 rounded border border-neutral-300 font-mono">↑↓</kbd>
                  للتنقل
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="bg-[var(--color-card-bg)] px-1.5 py-0.5 rounded border border-neutral-300 font-mono">Enter</kbd>
                  للاختيار
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="bg-[var(--color-card-bg)] px-1.5 py-0.5 rounded border border-neutral-300 font-mono">Esc</kbd>
                  للإغلاق
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}