import { useEffect } from "react";
import { Download, Plus } from "lucide-react";
import { useAppStore } from "@/data/store";
import { rowsToCSV } from "@/utils/marginMath";
import { ActionCenter } from "@/components/ActionCenter";
import { SummaryCards } from "./SummaryCards";
import { MarginTable } from "./MarginTable";
import { RevenueChart } from "./RevenueChart";

function downloadCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function DashboardView() {
  const loadAll = useAppStore((s) => s.loadAll);
  const settings = useAppStore((s) => s.settings);
  const rows = useAppStore((s) => s.marginRows());
  const summary = useAppStore((s) => s.dashboardSummary());

  useEffect(() => { loadAll(); }, [loadAll]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground mb-2">
          Live Margin Intelligence
        </h1>
        <p className="text-[13px] text-muted-foreground mb-6">
          Real-time food cost and margin tracking for every menu item
        </p>
        <div className="flex justify-end gap-4 mb-4">
          <button
            type="button"
            onClick={() => downloadCSV("menu-items-margins.csv", rowsToCSV(rows))}
            className="bg-surface border-none px-3 py-1.5 text-[13px] cursor-pointer inline-flex items-center gap-2"
            style={{ color: "#0d6efd" }}
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
            Export CSV
          </button>
          <button
            type="button"
            className="btn btn-primary !py-1.5 !px-3 !text-[13px]"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Add Menu Item
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        <div className="min-w-0">
          <RevenueChart />
          <SummaryCards summary={summary} />
          <MarginTable rows={rows} settings={settings} />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6">
          <ActionCenter />
        </aside>
      </div>
    </div>
  );
}
