import { useEffect } from "react";
import { Sparkles, Bell } from "lucide-react";
import { useAppStore } from "@/data/store";
import type { Recommendation } from "@/data/types";

function severityAccent(s: Recommendation["severity"]) {
  if (s === "critical") return "border-l-danger";
  if (s === "warning") return "border-l-primary";
  return "border-l-muted-foreground";
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const approve = useAppStore((s) => s.approveRecommendation);
  const dismiss = useAppStore((s) => s.dismissRecommendation);

  return (
    <article
      className={`bg-surface border border-border ${severityAccent(rec.severity)} border-l-4 rounded-lg p-5 shadow-sm transition-shadow hover:shadow-md`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {rec.agent} · Read-only Advisor
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-light text-foreground border border-border">
                {rec.severity}
              </span>
            </div>
            <h3 className="text-base font-semibold text-foreground leading-snug">
              {rec.title}: {rec.body}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Recommended action:</span>{" "}
              {rec.suggestedAction}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => dismiss(rec.id)}
          className="btn btn-secondary !py-2 !px-4 !text-sm"
        >
          Dismiss
        </button>
        <button
          type="button"
          onClick={() => approve(rec.id)}
          className="btn btn-primary !py-2 !px-4 !text-sm"
        >
          Approve & Apply
        </button>
      </div>
    </article>
  );
}

export function ActionCenter() {
  const recommendations = useAppStore((s) => s.recommendations);
  const load = useAppStore((s) => s.loadRecommendations);

  useEffect(() => { load(); }, [load]);

  const pending = recommendations.filter((r) => r.status === "pending");

  return (
    <section
      aria-labelledby="action-center-heading"
      className="mb-6 bg-gradient-to-br from-surface to-surface-light border border-border rounded-lg p-5 shadow-sm"
    >
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" aria-hidden />
          <h2 id="action-center-heading" className="text-sm font-bold uppercase tracking-wider text-foreground">
            Action Center
          </h2>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
            {pending.length}
          </span>
        </div>
        <span className="text-[11px] font-medium text-muted-foreground">
          AI recommendations · manual approval required
        </span>
      </header>

      {pending.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No pending recommendations. Sprocket is monitoring your margins.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {pending.map((rec) => (
            <RecommendationCard key={rec.id} rec={rec} />
          ))}
        </div>
      )}
    </section>
  );
}
