import type { ReactNode } from "react";

export type Column<T> = {
  key: string;
  header: string;
  align?: "left" | "right";
  className?: string;
  render: (row: T, index: number) => ReactNode;
};

/** Rounded panel table: soft corners, hairline borders, hover rows. */
export function DataTable<T>({
  title,
  subtitle,
  columns,
  rows,
  emptyText = "Nothing here yet.",
  footer,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  columns: Column<T>[];
  rows: T[];
  emptyText?: string;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`overflow-hidden rounded-xl border border-border bg-panel ${className}`}>
      {(title || subtitle) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold text-foreground">{title}</h2>}
            {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </header>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={`bg-secondary/60 px-5 py-3 text-left text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground ${
                    c.align === "right" ? "text-right" : ""
                  }`}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center text-sm text-muted-foreground">
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i} className="border-t border-border transition-colors hover:bg-row-hover">
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={`px-5 py-3 align-top ${c.align === "right" ? "text-right" : ""} ${c.className ?? ""}`}
                    >
                      {c.render(row, i)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {footer && <footer className="border-t border-border px-5 py-3 text-xs text-muted-foreground">{footer}</footer>}
    </section>
  );
}
