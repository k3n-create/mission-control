## Goal
Wire the frontend to the exact backend routes Sprocket published, pass `client_id` (Supabase `user.id`) on every call, and trigger a test fetch to populate the Kennedy Chicken simulation data.

## Route mapping (current → new)
| Where | Current call | New call |
|---|---|---|
| Integrations save | `POST /api/integrations/save` with `{platform, apiKey, simulation}` | `POST /api/integrations/save` with `{client_id, platform_name, master_api_key, simulation}` |
| Store sync after save | `POST /api/stores/sync?simulation=true` | `POST /api/stores/sync` with `{client_id, platform_name, simulation}` |
| Stores list | `GET /api/stores?simulation=true` | `GET /api/stores?client_id=...&simulation=true` |
| Revenue chart | `GET /api/reports/sales?days=14` | `GET /api/sales/report?client_id=...&days=14&simulation=true` |
| (new) Platforms | — | `GET /api/delivery-platforms` (used to hydrate Integrations card list) |
| (new) Disconnect | — | `DELETE /api/integrations/:id` (wired to a "Disconnect" button on connected cards) |
| Health probe | — | `GET /health` (used by the test fetch) |

## Changes

1. **`src/lib/api.ts`** — add a small helper `withClientId(params?)` that resolves the current Supabase user id and returns it as a query-string fragment, plus an `apiFetchJson` wrapper that injects `X-Client-Id` header on every request when a session exists. Keeps Bearer token behaviour as-is.

2. **`src/pages/Integrations.tsx`**
   - Change save payload to `{client_id, platform_name, master_api_key, simulation}`.
   - Change sync call body to `{client_id, platform_name, simulation}` (no querystring).
   - Track the returned `integration_id` per card so the Disconnect button can call `DELETE /api/integrations/:id`.
   - Optionally hydrate the card list from `GET /api/delivery-platforms` on mount; fall back to the hard-coded PLATFORMS array if the call fails (keeps Kennedy DoorDash sim path working without backend dependency).

3. **`src/pages/Stores.tsx`** — pass `client_id` in the querystring on `GET /api/stores`.

4. **`src/components/dashboard/RevenueChart.tsx`** — switch endpoint to `GET /api/sales/report`, pass `client_id` + `days=14` + `simulation` when relevant. Keep existing aggregation logic (it already handles `merchant_supplied_id`, `date`/`day`, `revenue`/`net_revenue`/`total`).

5. **Test fetch trigger** — after Implement, no code change is needed: simply
   - open `/integrations`, connect DoorDash with `KENNEDY_SIM`,
   - the app will hit `save` → `sync` → revalidate Stores + RevenueChart automatically via `onIntegrationsChange`.
   I'll verify the three network calls return 200 in the preview and confirm the 12 KC stores + 14-day chart populate.

## Out of scope
- No backend changes; assumes Sprocket's routes behave as documented.
- No UI redesign — only data wiring.
- `/api/orders` (used by the store drawer) is left untouched; Sprocket didn't list it. If it 404s after this change I'll flag it separately.
