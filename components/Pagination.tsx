
"use client";

import {
  ChevronRight,
  ChevronLeft,
  MoreHorizontal,
} from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 25, 50, 100],
}: PaginationProps) {
  if (totalItems <= 0) return null;

  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(
    Math.max(1, currentPage),
    safeTotalPages
  );

  const startItem = (safeCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(
    safeCurrentPage * pageSize,
    totalItems
  );

  const getVisiblePages = (): (number | "ellipsis")[] => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 5;

    if (safeTotalPages <= maxVisible + 2) {
      for (let i = 1; i <= safeTotalPages; i++) {
        pages.push(i);
      }

      return pages;
    }

    pages.push(1);

    if (safeCurrentPage <= 3) {
      for (
        let i = 2;
        i <= Math.min(maxVisible, safeTotalPages - 1);
        i++
      ) {
        pages.push(i);
      }

      if (safeTotalPages > maxVisible + 1) {
        pages.push("ellipsis");
      }

      pages.push(safeTotalPages);

      return pages;
    }

    if (safeCurrentPage >= safeTotalPages - 2) {
      pages.push("ellipsis");

      for (
        let i = safeTotalPages - maxVisible + 1;
        i <= safeTotalPages;
        i++
      ) {
        pages.push(i);
      }

      return pages;
    }

    pages.push("ellipsis");

    for (
      let i = safeCurrentPage - 1;
      i <= safeCurrentPage + 1;
      i++
    ) {
      pages.push(i);
    }

    pages.push("ellipsis");
    pages.push(safeTotalPages);

    return pages;
  };

  const handlePageSizeChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newSize = Number(event.target.value);

    if (onPageSizeChange) {
      onPageSizeChange(newSize);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-t border-[var(--color-card-border)]">
      <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-neutral-500)]">
        <span>
          عرض{" "}
          <strong className="text-[var(--color-fg)]">
            {startItem}
          </strong>
          {"–"}
          <strong className="text-[var(--color-fg)]">
            {endItem}
          </strong>
          {" من "}
          <strong className="text-[var(--color-fg)]">
            {totalItems.toLocaleString("ar-EG")}
          </strong>
        </span>

        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className="bg-[var(--color-card-bg)] text-[var(--color-fg)] border border-[var(--color-card-border)] rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-primary-400"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} / صفحة
              </option>
            ))}
          </select>
        )}
      </div>

      {safeTotalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(safeCurrentPage - 1)}
            disabled={safeCurrentPage === 1}
            className="p-2 rounded-lg border border-[var(--color-card-border)] text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-50)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="السابق"
          >
            <ChevronRight size={16} />
          </button>

          {getVisiblePages().map((page, idx) => {
            if (page === "ellipsis") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 text-[var(--color-neutral-400)]"
                >
                  <MoreHorizontal size={16} />
                </span>
              );
            }

            return (
              <button
                type="button"
                key={page}
                onClick={() => onPageChange(page)}
                aria-current={
                  safeCurrentPage === page ? "page" : undefined
                }
                className={`min-w-[36px] h-9 rounded-lg text-sm font-bold transition-all ${
                  safeCurrentPage === page
                    ? "bg-primary-500 text-white shadow-sm shadow-primary-200"
                    : "text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-50)] border border-[var(--color-card-border)]"
                }`}
              >
                {page}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => onPageChange(safeCurrentPage + 1)}
            disabled={safeCurrentPage === safeTotalPages}
            className="p-2 rounded-lg border border-[var(--color-card-border)] text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-50)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="التالي"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
