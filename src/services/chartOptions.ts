// Author-chosen chart options (title, axis labels, category order) and how they are applied.
// Pure so the page, the visual chart, the table and the Olli view all agree.
import type { SonificationConfig } from "../types/types";

export type CategoryOrder = NonNullable<SonificationConfig["categoryOrder"]>;

export const CATEGORY_ORDERS: { value: CategoryOrder; label: string }[] = [
  { value: "data", label: "Order in the file" },
  { value: "alpha", label: "Alphabetical" },
  { value: "value-desc", label: "Largest value first" },
  { value: "value-asc", label: "Smallest value first" },
];

type Row = Record<string, unknown>;

const asNumber = (v: unknown): number | null => {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
};

/**
 * Returns the rows with categories in the requested order. Rows that share a category stay
 * together, in their original relative order. "data" (or an unknown value) returns the input.
 */
export function orderRowsByCategory<T extends Row>(
  rows: T[],
  categoryField: string | null | undefined,
  valueField: string | null | undefined,
  order: CategoryOrder | null | undefined
): T[] {
  if (!order || order === "data" || !categoryField) return rows;
  if (!rows.some((r) => categoryField in r)) return rows;

  const key = (r: T) => String(r[categoryField] ?? "");
  const firstSeen = new Map<string, number>();
  const total = new Map<string, number>();
  rows.forEach((r, i) => {
    const k = key(r);
    if (!firstSeen.has(k)) firstSeen.set(k, i);
    const v = valueField ? asNumber(r[valueField]) : null;
    total.set(k, (total.get(k) ?? 0) + (v ?? 0));
  });

  const cats = [...firstSeen.keys()];
  if (order === "alpha") {
    cats.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
  } else {
    const sign = order === "value-desc" ? -1 : 1;
    cats.sort((a, b) => sign * ((total.get(a) ?? 0) - (total.get(b) ?? 0)) || firstSeen.get(a)! - firstSeen.get(b)!);
  }
  const rank = new Map(cats.map((c, i) => [c, i]));
  // Array.prototype.sort is stable, so rows within one category keep their order.
  return [...rows].sort((a, b) => rank.get(key(a))! - rank.get(key(b))!);
}

/** Trimmed text, or undefined when the author left it blank. */
export const cleanLabel = (v: string | null | undefined): string | undefined => {
  const t = v?.trim();
  return t ? t : undefined;
};
