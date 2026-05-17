import type { MarginStatus } from "@/utils/marginMath";

// Exact legacy palette — bg / fg pairs from index.legacy.html lines 60-64 & 1161-1164.
const STYLES: Record<MarginStatus, { bg: string; fg: string }> = {
  good: { bg: "#d1f7c4", fg: "#198754" },
  warn: { bg: "#fff3cd", fg: "#fd7e14" },
  bad:  { bg: "#f8d7da", fg: "#dc3545" },
  idle: { bg: "#e9ecef", fg: "#6c757d" },
};

interface Props {
  status: MarginStatus;
  margin: number;       // %
  subline?: string;     // e.g. "$1.23 profit"
}

export function MarginPill({ status, margin, subline }: Props) {
  const s = STYLES[status];
  return (
    <div
      className="inline-block rounded px-2 py-1 text-center"
      style={{ background: s.bg }}
    >
      <span className="text-[13px] font-semibold" style={{ color: s.fg }}>
        {margin.toFixed(1)}%
      </span>
      {subline && (
        <div className="text-[11px] font-normal text-muted-foreground">
          {subline}
        </div>
      )}
    </div>
  );
}
