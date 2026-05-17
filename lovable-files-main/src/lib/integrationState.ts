// Tiny localStorage-backed flag tracking which platforms are in "simulation" mode.
// Set when the user connects with the KENNEDY_SIM master API key.

const KEY = "integrations.simulation";

type State = Record<string, boolean>;

function read(): State {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as State) : {};
  } catch {
    return {};
  }
}

function write(state: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent("integrations:changed"));
  } catch {
    /* ignore */
  }
}

export function setSimulation(platform: string, on: boolean) {
  const s = read();
  if (on) s[platform] = true;
  else delete s[platform];
  write(s);
}

export function isSimulation(platform?: string) {
  const s = read();
  if (platform) return Boolean(s[platform]);
  return Object.values(s).some(Boolean);
}

export function onIntegrationsChange(cb: () => void) {
  const handler = () => cb();
  window.addEventListener("integrations:changed", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("integrations:changed", handler);
    window.removeEventListener("storage", handler);
  };
}

export const SIM_API_KEY = "KENNEDY_SIM";
