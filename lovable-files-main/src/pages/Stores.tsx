import { useEffect, useState } from "react";
import { Loader2, MapPin, Phone, Hash, RefreshCw, X, Truck } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, getClientId } from "@/lib/api";
import { isSimulation, onIntegrationsChange } from "@/lib/integrationState";

interface Store {
  id?: string | number;
  merchant_supplied_id?: string;
  store_id?: string;
  name?: string;
  store_name?: string;
  address?: string;
  street_address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  phone_number?: string;
  platform?: string;
}

interface OrderRow {
  delivery_id?: string;
  order_id?: string;
  external_delivery_id?: string;
  status?: string;
  subtotal?: number;
  total?: number;
  created_at?: string;
  customer_name?: string;
  merchant_supplied_id?: string;
}

function fmtAddress(s: Store) {
  const line = s.address ?? s.street_address ?? "";
  const tail = [s.city, s.state, s.zip].filter(Boolean).join(", ");
  return [line, tail].filter(Boolean).join(", ") || "—";
}

function storeKey(s: Store) {
  return s.merchant_supplied_id ?? s.store_id ?? String(s.id ?? "");
}

export default function Stores() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Store | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const sim = isSimulation();
      const client_id = await getClientId();
      const params = new URLSearchParams();
      if (client_id) params.set("client_id", client_id);
      if (sim) params.set("simulation", "true");
      const qs = params.toString() ? `?${params.toString()}` : "";
      const data = await apiFetch<Store[] | { stores: Store[] }>(`/api/stores${qs}`);
      const list = Array.isArray(data) ? data : data?.stores ?? [];
      setStores(list);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load stores";
      setError(msg);
      toast.error("Could not load stores", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    return onIntegrationsChange(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground mb-2">Store Management</h1>
          <p className="text-[13px] text-muted-foreground">
            All locations discovered across your connected delivery platforms.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="btn !py-1.5 !px-3 !text-[13px] disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="panel !p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-[13px]">Loading stores…</span>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-[13px] text-danger">{error}</div>
        ) : stores.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-muted-foreground">
            No stores yet. Connect an integration to discover your locations.
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="bg-surface-light border-b border-border">
              <tr className="text-left text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Merchant ID</th>
                <th className="px-4 py-3 font-semibold">Store</th>
                <th className="px-4 py-3 font-semibold">Address</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Platform</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {stores.map((s) => (
                <tr key={storeKey(s)} className="border-b border-border last:border-0 hover:bg-surface-light">
                  <td className="px-4 py-3 font-mono text-foreground">
                    {s.merchant_supplied_id ?? s.store_id ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {s.name ?? s.store_name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtAddress(s)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {s.phone ?? s.phone_number ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground">
                      {s.platform ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelected(s)}
                      className="text-[12px] font-semibold text-primary hover:underline"
                    >
                      View orders
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <StoreOrdersDrawer store={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function StoreOrdersDrawer({ store, onClose }: { store: Store; onClose: () => void }) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const sim = isSimulation();
        const params = new URLSearchParams();
        if (sim) params.set("simulation", "true");
        const id = store.merchant_supplied_id ?? store.store_id ?? "";
        if (id) params.set("merchant_supplied_id", id);
        const qs = params.toString() ? `?${params.toString()}` : "";
        const data = await apiFetch<OrderRow[] | { orders: OrderRow[] }>(`/api/orders${qs}`);
        setOrders(Array.isArray(data) ? data : data?.orders ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [store]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-foreground/40" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-surface h-full overflow-y-auto border-l border-border shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-6 py-5 border-b border-border sticky top-0 bg-surface">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {store.name ?? store.store_name ?? "Store"}
            </h2>
            <p className="text-[12px] text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <Hash className="h-3 w-3" />
                <span className="font-mono">{store.merchant_supplied_id ?? store.store_id}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {fmtAddress(store)}
              </span>
              {(store.phone ?? store.phone_number) && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {store.phone ?? store.phone_number}
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          <h3 className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Recent orders
          </h3>

          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-[13px] py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading orders…
            </div>
          ) : error ? (
            <p className="text-[13px] text-muted-foreground">
              No orders endpoint available yet ({error}).
            </p>
          ) : orders.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">No orders yet for this store.</p>
          ) : (
            <ul className="space-y-2">
              {orders.map((o, i) => {
                const did = o.delivery_id ?? o.external_delivery_id ?? o.order_id;
                return (
                  <li
                    key={(did ?? i) + ""}
                    className="border border-border rounded-md p-3 bg-surface-light"
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <div className="inline-flex items-center gap-2 text-[12px] text-muted-foreground">
                        <Truck className="h-3.5 w-3.5" />
                        <span className="font-semibold text-foreground">delivery_id</span>
                        <span className="font-mono text-foreground">{did ?? "—"}</span>
                      </div>
                      {o.status && (
                        <span className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground">
                          {o.status}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[12px] text-muted-foreground">
                      <span>{o.customer_name ?? "—"}</span>
                      <span className="font-semibold text-foreground">
                        {typeof (o.total ?? o.subtotal) === "number"
                          ? `$${(o.total ?? o.subtotal)!.toFixed(2)}`
                          : "—"}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
