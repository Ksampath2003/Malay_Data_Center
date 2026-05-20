"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  align?: "left" | "right";
  render?: (row: T) => React.ReactNode;
  numeric?: boolean;
  sortAccessor?: (row: T) => number | string;
}

interface Props<T> {
  rows: T[];
  columns: Column<T>[];
  initialSort?: { key: string; dir: "asc" | "desc" };
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  rows,
  columns,
  initialSort,
  className,
}: Props<T>) {
  const [sort, setSort] = useState(initialSort);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    const acc = col.sortAccessor ?? ((r: T) => r[col.key as keyof T]);
    return [...rows].sort((a, b) => {
      const av = acc(a) as number | string;
      const bv = acc(b) as number | string;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return sort.dir === "asc" ? -1 : 1;
      if (av > bv) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
  }, [rows, columns, sort]);

  const toggleSort = (key: string) =>
    setSort((s) =>
      s?.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "desc" },
    );

  return (
    <div className={clsx("overflow-x-auto", className)}>
      <table className="w-full text-[12px]">
        <thead>
          <tr className="text-left border-b border-[color:var(--border)]">
            {columns.map((c) => (
              <th
                key={String(c.key)}
                onClick={() => toggleSort(String(c.key))}
                className={clsx(
                  "py-2 px-2 eyebrow text-ink-400 select-none cursor-pointer hover:text-ink-200",
                  c.align === "right" && "text-right",
                )}
              >
                {c.header}
                {sort?.key === c.key && (
                  <span className="ml-1 text-accent-400">{sort.dir === "asc" ? "▲" : "▼"}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr
              key={i}
              className="border-b border-[color:var(--border)]/60 hover:bg-white/[0.02]"
            >
              {columns.map((c) => (
                <td
                  key={String(c.key)}
                  className={clsx(
                    "py-2 px-2 text-ink-100",
                    c.align === "right" && "text-right num",
                    c.numeric && "num",
                  )}
                >
                  {c.render ? c.render(row) : String(row[c.key as keyof T] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
