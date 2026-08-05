import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "../../lib/format";

function pageList(page: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}

export function Pagination({
  page,
  total,
  perPage,
  onPageChange,
}: {
  page: number;
  total: number;
  perPage: number;
  onPageChange: (p: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / perPage));

  return (
    <nav
      className="flex items-center justify-between gap-3 border-t border-edge/70 px-5 py-3.5"
      aria-label="Pagination"
    >
      <p className="text-xs text-muted">
        {total === 0 ? "No results" : `${(page - 1) * perPage + 1}–${Math.min(page * perPage, total)} of ${total}`}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="btn-focus grid h-8 w-8 place-items-center rounded-lg border border-edge text-muted transition hover:bg-surface2 hover:text-ink disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pageList(page, pageCount).map((p, i) =>
          p === "…" ? (
            <span key={`e${i}`} className="px-1 text-xs text-muted">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "btn-focus grid h-8 w-8 place-items-center rounded-lg text-xs font-semibold transition",
                p === page
                  ? "bg-brand text-white shadow-soft"
                  : "text-muted hover:bg-surface2 hover:text-ink"
              )}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          aria-label="Next page"
          className="btn-focus grid h-8 w-8 place-items-center rounded-lg border border-edge text-muted transition hover:bg-surface2 hover:text-ink disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
