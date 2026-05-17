import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Loader2, TrendingUp } from "lucide-react";
import { apiFetch, getClientId } from "@/lib/api";
import { isSimulation, onIntegrationsChange } from "@/lib/integrationState";

interface SalesPoint {
  date?: string;
  day?: string;
  revenue?: number;
  total?: number;
  net_revenue?: number;
  merchant_supplied_id?: string;
  store_id?: string;
}

function fmtUSD(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function RevenueChart() {
  const [data, setData] = useState<SalesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const sim = isSimulation();
      const client_id = await getClientId();
      const params = new URLSearchParams();
      if (client_id) params.set("client_id", client_id);
      params.set("days", "14");
      if (sim) params.set("simulation", "true");
      const res = await apiFetch<SalesPoint[] | { sales: SalesPoint[] }>(
        `/api/sales/report?${params.toString()}`
      );
      setData(Array.isArray(res) ? res : res?.sales ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    return onIntegrationsChange(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Aggregate revenue across all stores by date
  const series = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const row of data) {
      const day = row.date ?? row.day ?? "";
      if (!day) continue;
      const rev = row.revenue ?? row.net_revenue ?? row.total ?? 0;
      byDay.set(day, (byDay.get(day) ?? 0) + rev);
    }
    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([day, revenue]) => ({ day, dayLabel: fmtDate(day), revenue }));
  }, [data]);

  const total = series.reduce((acc, p) => acc + p.revenue, 0);

  return (
    <section className="panel">
      <header className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground inline-flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Global Revenue · Last 14 days
          </h2>
          <p className="text-[12px] text-muted-foreground mt-1">
            Aggregated across all connected stores.
          </p>
        </div>
        {series.length > 0 && (
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
              Total
            </p>
            <p className="text-lg font-bold text-foreground">{fmtUSD(total)}</p>
          </div>
        )}
      </header>

      <div className="h-[260px]">
        {loading ? (
          <div className="h-full flex items-center justify-center gap-2 text-muted-foreground text-[13px]">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading sales…
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center text-[13px] text-muted-foreground text-center px-6">
            {error}. Connect an integration on the Integrations page to populate this chart.
          </div>
        ) : series.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[13px] text-muted-foreground">
            No sales data yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="revLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--primary-dark))" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="dayLabel"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => fmtUSD(Number(v))}
                width={70}
              />
              <Tooltip
                cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                contentStyle={{
                  background: "hsl(var(--surface))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v) => [fmtUSD(Number(v)), "Revenue"]}
                labelStyle={{ color: "hsl(var(--muted-foreground))" }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="url(#revLine)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
