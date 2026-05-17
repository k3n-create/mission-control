// Pure margin math. No React, no DOM, no store access.
// All functions are deterministic and unit-test friendly.

import type { Ingredient, MenuItem, RecipeLine, Settings } from "@/data/types";

export type MarginStatus = "good" | "warn" | "bad" | "idle";

export interface MarginRow {
  id: string;
  name: string;
  cogs: number;
  posPrice: number;
  posProfit: number;
  posMargin: number;        // %
  posStatus: MarginStatus;
  deliveryPrice: number;
  deliveryNet: number;      // after commission
  deliveryProfit: number;
  deliveryMargin: number;   // %
  deliveryStatus: MarginStatus;
}

export interface DashboardSummary {
  totalItems: number;
  criticalAlerts: number;
  avgPosMargin: number;
  avgDeliveryMargin: number;
}

export function calculateRecipeCost(
  recipe: RecipeLine[],
  ingredientsById: Map<string, Ingredient>
): number {
  let total = 0;
  for (const line of recipe) {
    const ing = ingredientsById.get(line.ingredientId);
    if (!ing) continue;
    total += ing.unitCost * line.quantity;
  }
  return total;
}

export function marginPct(net: number, cost: number): number {
  return net > 0 ? ((net - cost) / net) * 100 : 0;
}

export function statusFor(
  margin: number,
  settings: Settings
): MarginStatus {
  if (margin >= settings.targetMargin) return "good";
  if (margin >= settings.criticalThreshold) return "warn";
  return "bad";
}

export function buildMarginRow(
  item: MenuItem,
  ingredientsById: Map<string, Ingredient>,
  settings: Settings
): MarginRow {
  const cogs = calculateRecipeCost(item.recipe, ingredientsById);

  const posProfit = item.posPrice - cogs;
  const posMargin = marginPct(item.posPrice, cogs);

  const deliveryNet = item.deliveryPrice * (1 - settings.commissionRate);
  const deliveryProfit = deliveryNet - cogs;
  const deliveryMargin = marginPct(deliveryNet, cogs);

  return {
    id: item.id,
    name: item.name,
    cogs,
    posPrice: item.posPrice,
    posProfit,
    posMargin,
    posStatus: statusFor(posMargin, settings),
    deliveryPrice: item.deliveryPrice,
    deliveryNet,
    deliveryProfit,
    deliveryMargin,
    deliveryStatus: statusFor(deliveryMargin, settings),
  };
}

export function summarize(
  rows: MarginRow[],
  settings: Settings
): DashboardSummary {
  const totalItems = rows.length;
  if (totalItems === 0) {
    return { totalItems: 0, criticalAlerts: 0, avgPosMargin: 0, avgDeliveryMargin: 0 };
  }
  let critical = 0;
  let pos = 0;
  let del = 0;
  for (const r of rows) {
    pos += r.posMargin;
    del += r.deliveryMargin;
    if (
      r.posMargin < settings.criticalThreshold ||
      r.deliveryMargin < settings.criticalThreshold
    ) {
      critical++;
    }
  }
  return {
    totalItems,
    criticalAlerts: critical,
    avgPosMargin: pos / totalItems,
    avgDeliveryMargin: del / totalItems,
  };
}

export function rowsToCSV(rows: MarginRow[]): string {
  const header =
    "Menu Item,COGS,POS Price,POS Margin,POS Profit,Delivery Price,Delivery Net,Delivery Margin,Delivery Profit\n";
  const body = rows
    .map(
      (r) =>
        `"${r.name}",$${r.cogs.toFixed(2)},$${r.posPrice.toFixed(2)},${r.posMargin.toFixed(1)}%,$${r.posProfit.toFixed(2)},$${r.deliveryPrice.toFixed(2)},$${r.deliveryNet.toFixed(2)},${r.deliveryMargin.toFixed(1)}%,$${r.deliveryProfit.toFixed(2)}`
    )
    .join("\n");
  return header + body + "\n";
}
