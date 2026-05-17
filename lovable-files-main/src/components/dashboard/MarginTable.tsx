import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { MarginRow } from "@/utils/marginMath";
import type { Settings } from "@/data/types";
import { useAppStore } from "@/data/store";
import { MarginTableRow } from "./MarginTableRow";

interface Props {
  rows: MarginRow[];
  settings: Settings;
}

const th =
  "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-2 px-2.5 border-b border-border";

type SortKey = "posMargin" | "deliveryMargin";
type SortDir = "asc" | "desc";

export function MarginTable({ rows, settings }: Props) {
  const menuItems = useAppStore((s) => s.menuItems);
  const menuCategories = useAppStore((s) => s.menuCategories);

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const itemCategoryById = useMemo(() => {
    const m = new Map<string, string | null | undefined>();
    for (const it of menuItems) m.set(it.id, it.menuCategoryId ?? null);
    return m;
  }, [menuItems]);

  const visibleRows = useMemo(() => {
    let r = rows;
    if (categoryFilter !== "all") {
      r = r.filter((row) => {
        const cid = itemCategoryById.get(row.id) ?? null;
        if (categoryFilter === "__uncat") return !cid;
        return cid === categoryFilter;
      });
    }
    if (sortKey) {
      r = [...r].sort((a, b) => {
        const diff = a[sortKey] - b[sortKey];
        return sortDir === "asc" ? diff : -diff;
      });
    }
    return r;
  }, [rows, categoryFilter, sortKey, sortDir, itemCategoryById]);

  function toggleSort(key: SortKey) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("desc");
    } else if (sortDir === "desc") {
      setSortDir("asc");
    } else {
      setSortKey(null);
    }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ArrowUpDown className="h-3 w-3 opacity-50" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  }

  return (
    <div className="bg-surface rounded-lg p-4 mb-6 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-border gap-3 flex-wrap">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
          Menu Item Margins
        </h2>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-border rounded-md bg-surface px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All categories</option>
              {menuCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
              <option value="__uncat">Uncategorized</option>
            </select>
          </label>
          <span className="text-xs text-muted-foreground">
            Commission: {Math.round(settings.commissionRate * 100)}% | Target margin: {settings.targetMargin}%
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={`${th} text-left`}>Menu Item</th>
              <th className={`${th} text-left`}>COGS</th>
              <th className={`${th} text-left`}>POS Price</th>
              <th className={`${th} text-center`}>
                <button
                  type="button"
                  onClick={() => toggleSort("posMargin")}
                  className="inline-flex items-center gap-1 uppercase tracking-wider text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  POS Margin
                  <SortIcon k="posMargin" />
                </button>
              </th>
              <th className={`${th} text-left`}>Delivery Price</th>
              <th className={`${th} text-center`}>
                <button
                  type="button"
                  onClick={() => toggleSort("deliveryMargin")}
                  className="inline-flex items-center gap-1 uppercase tracking-wider text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Net After {Math.round(settings.commissionRate * 100)}% Fee
                  <SortIcon k="deliveryMargin" />
                </button>
              </th>
              <th className={`${th} text-center`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center text-muted-foreground py-10 text-[13px]"
                >
                  {rows.length === 0
                    ? "No menu items built yet. Use the Recipe Builder to start."
                    : "No menu items match the selected category."}
                </td>
              </tr>
            ) : (
              visibleRows.map((r, i) => (
                <MarginTableRow key={r.id} row={r} zebra={i % 2 === 1} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-5 pt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: "#198754" }} />
          Good margin (above target)
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: "#fd7e14" }} />
          Low margin (watch closely)
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: "#dc3545" }} />
          Critical (below {settings.criticalThreshold}% threshold)
        </div>
      </div>
    </div>
  );
}
