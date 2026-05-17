import { MarginPill } from "@/components/dashboard/MarginPill";
import type { MarginStatus } from "@/utils/marginMath";

interface Props {
  cogs: number;
  posPrice: number;
  posMargin: number;
  posProfit: number;
  posStatus: MarginStatus;
  deliveryPrice: number;
  deliveryNet: number;
  deliveryMargin: number;
  deliveryProfit: number;
  deliveryStatus: MarginStatus;
  commissionRate: number;
}

export function LiveCostPreview({
  cogs,
  posPrice,
  posMargin,
  posProfit,
  posStatus,
  deliveryPrice,
  deliveryNet,
  deliveryMargin,
  deliveryProfit,
  deliveryStatus,
  commissionRate,
}: Props) {
  const hasPos = posPrice > 0;
  const hasDel = deliveryPrice > 0;

  return (
    <aside className="panel mb-0 sticky top-4">
      <h3 className="text-sm font-medium text-foreground mb-4">Live Cost Preview</h3>

      <div className="bg-surface-light border border-border rounded-lg p-4 mb-3">
        <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1">
          Total COGS
        </div>
        <div className="text-2xl font-bold text-foreground">${cogs.toFixed(2)}</div>
      </div>

      <div className="bg-surface-light border border-border rounded-lg p-4 mb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            POS Margin
          </div>
          {hasPos ? (
            <MarginPill status={posStatus} margin={posMargin} />
          ) : (
            <MarginPill status="idle" margin={0} />
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          Profit: ${posProfit.toFixed(2)}
        </div>
      </div>

      <div className="bg-surface-light border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Delivery Net Margin
          </div>
          {hasDel ? (
            <MarginPill status={deliveryStatus} margin={deliveryMargin} />
          ) : (
            <MarginPill status="idle" margin={0} />
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          Net (after {(commissionRate * 100).toFixed(0)}% fee): ${deliveryNet.toFixed(2)}
        </div>
        <div className="text-xs text-muted-foreground">
          Net profit: ${deliveryProfit.toFixed(2)}
        </div>
      </div>
    </aside>
  );
}
