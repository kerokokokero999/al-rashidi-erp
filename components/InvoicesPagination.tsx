
"use client";

import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import Pagination from "./Pagination";

interface InvoicesPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}

export default function InvoicesPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
}: InvoicesPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateQuery = (page: number, size: number) => {
    const params = new URLSearchParams(
      searchParams.toString()
    );

    params.set("page", String(page));
    params.set("pageSize", String(size));

    router.push(`${pathname}?${params.toString()}`, {
      scroll: false,
    });
  };

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={totalItems}
      pageSize={pageSize}
      pageSizeOptions={[10, 20, 25, 50, 100]}
      onPageChange={(page) => {
        updateQuery(page, pageSize);
      }}
      onPageSizeChange={(size) => {
        updateQuery(1, size);
      }}
    />
  );
}