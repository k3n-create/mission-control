import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Plug } from "lucide-react";
import { apiFetch, getClientId } from "@/lib/api";
import { setSimulation, SIM_API_KEY } from "@/lib/integrationState";
import { ConnectIntegrationModal } from "@/components/integrations/ConnectIntegrationModal";

type PlatformId = "doordash" | "ubereats" | "grubhub";

interface Platform {
  id: PlatformId;
  label: string;
  description: string;
  accent: string; // semantic class for accent dot
}

const PLATFORMS: Platform[] = [
  {
    id: "doordash",
    label: "DoorDash",
    description: "Sync stores, menus, and order-level commission data from DoorDash Marketplace.",
    accent: "bg-danger",
  },
  {
    id: "ubereats",
    label: "Uber Eats",
    description: "Pull store locations and net payout data from your Uber Eats Manager account.",
    accent: "bg-foreground",
  },
  {
    id: "grubhub",
    label: "Grubhub",
    description: "Connect Grubhub for Restaurants to track orders, fees, and store-level margins.",
    accent: "bg-primary",
  },
];

interface CardState {
  connected: boolean;
  syncing: boolean;
  storeCount: number | null;
}

const initialCardState: CardState = { connected: false, syncing: false, storeCount: null };

export default function Integrations() {
  const [openFor, setOpenFor] = useState<PlatformId | null>(null);
  const [saving, setSaving] = useState(false);
  const [cards, setCards] = useState<Record<PlatformId, CardState>>({
    doordash: { ...initialCardState },
    ubereats: { ...initialCardState },
    grubhub: { ...initialCardState },
  });

  const updateCard = (id: PlatformId, patch: Partial<CardState>) =>
    setCards((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const handleSave = async (platform: PlatformId, apiKey: string) => {
    setSaving(true);
    const simulation = apiKey.trim() === SIM_API_KEY;
    try {
      const client_id = await getClientId();
      if (!client_id) throw new Error("You must be signed in to connect an integration.");

      await apiFetch("/api/integrations/save", {
        method: "POST",
        body: JSON.stringify({
          client_id,
          platform_name: platform,
          master_api_key: apiKey,
          simulation,
        }),
      });
      setSimulation(platform, simulation);
      // Close modal, switch card to syncing
      setOpenFor(null);
      updateCard(platform, { syncing: true });

      try {
        const sync = await apiFetch<{ count?: number; stores?: unknown[] }>(
          `/api/stores/sync`,
          {
            method: "POST",
            body: JSON.stringify({ client_id, platform_name: platform, simulation }),
          }
        );
        const count = sync?.count ?? sync?.stores?.length ?? 0;
        updateCard(platform, { syncing: false, connected: true, storeCount: count });
        toast.success(`${labelOf(platform)} connected${simulation ? " (Simulation)" : ""}`, {
          description: `Discovered ${count} location${count === 1 ? "" : "s"}.`,
        });
      } catch (err) {
        updateCard(platform, { syncing: false });
        toast.error("Sync failed", {
          description: err instanceof Error ? err.message : "Could not discover locations.",
        });
      }
    } catch (err) {
      toast.error("Could not save integration", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground mb-2">Integrations</h1>
        <p className="text-[13px] text-muted-foreground">
          Connect your delivery platforms to sync stores and orders in real time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLATFORMS.map((p) => {
          const state = cards[p.id];
          return (
            <div key={p.id} className="panel relative overflow-hidden">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-md ${p.accent} flex items-center justify-center text-surface`}>
                    <Plug className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground leading-tight">{p.label}</h2>
                    <StatusPill connected={state.connected} />
                  </div>
                </div>
              </div>

              <p className="text-[13px] text-muted-foreground mb-4">{p.description}</p>

              {state.connected && state.storeCount !== null && (
                <p className="text-[12px] text-muted-foreground mb-3">
                  <span className="text-foreground font-semibold">{state.storeCount}</span>{" "}
                  location{state.storeCount === 1 ? "" : "s"} discovered.
                </p>
              )}

              <button
                type="button"
                onClick={() => setOpenFor(p.id)}
                disabled={state.syncing}
                className="btn btn-primary !py-1.5 !px-3 !text-[13px] disabled:opacity-50"
              >
                {state.connected ? "Reconnect" : "Connect"}
              </button>

              {state.syncing && (
                <div className="absolute inset-0 bg-surface/90 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <p className="text-[13px] text-foreground font-medium">Discovering your locations…</p>
                  <p className="text-[12px] text-muted-foreground">Talking to {p.label}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ConnectIntegrationModal
        open={openFor !== null}
        platformLabel={openFor ? labelOf(openFor) : ""}
        saving={saving}
        onClose={() => !saving && setOpenFor(null)}
        onSave={async (key) => { if (openFor) await handleSave(openFor, key); }}
      />
    </div>
  );
}

function labelOf(id: PlatformId) {
  return PLATFORMS.find((p) => p.id === id)?.label ?? id;
}

function StatusPill({ connected }: { connected: boolean }) {
  if (connected) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-success font-semibold">
        <CheckCircle2 className="h-3 w-3" />
        Connected
      </span>
    );
  }
  return <span className="text-[11px] text-muted-foreground font-medium">Not connected</span>;
}
