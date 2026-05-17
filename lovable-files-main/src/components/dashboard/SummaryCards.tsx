import { ShoppingBag, AlertTriangle, TrendingUp, LayoutGrid } from "lucide-react";
import type { DashboardSummary } from "@/utils/marginMath";

interface CardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

function Card({ label, value, icon }: CardProps) {
  return (
    <div className="bg-surface rounded-lg p-4 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
      <div className="flex items-start justify-between mb-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {icon}
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
    </div>
  );
}

export function SummaryCards({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card
        label="Total Items"
        value={String(summary.totalItems)}
        icon={<ShoppingBag className="h-4 w-4" style={{ color: "#0d6efd" }} aria-hidden />}
      />
      <Card
        label="Critical Margin Alerts"
        value={String(summary.criticalAlerts)}
        icon={<AlertTriangle className="h-4 w-4" style={{ color: "#198754" }} aria-hidden />}
      />
      <Card
        label="Avg POS Margin"
        value={`${summary.avgPosMargin.toFixed(1)}%`}
        icon={<TrendingUp className="h-4 w-4" style={{ color: "#198754" }} aria-hidden />}
      />
      <Card
        label="Avg Delivery Net"
        value={`${summary.avgDeliveryMargin.toFixed(1)}%`}
        icon={<LayoutGrid className="h-4 w-4" style={{ color: "#6f42c1" }} aria-hidden />}
      />
    </div>
  );
}
