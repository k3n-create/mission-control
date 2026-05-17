import { Component, type ErrorInfo, type ReactNode } from "react";
import { useAppStore } from "@/data/store";

interface Props { children: ReactNode }
interface State { error: Error | null; info: ErrorInfo | null; copied: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null, copied: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ info });
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info);
  }

  private copyLog = async () => {
    const { error, info } = this.state;
    let storeSnapshot: unknown = "<unavailable>";
    try {
      const s = useAppStore.getState() as unknown as Record<string, unknown>;
      // strip functions for clean JSON
      storeSnapshot = Object.fromEntries(
        Object.entries(s).filter(([, v]) => typeof v !== "function")
      );
    } catch { /* noop */ }

    const payload = {
      timestamp: new Date().toISOString(),
      route: typeof window !== "undefined" ? window.location.href : "",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      message: error?.message ?? String(error),
      stack: error?.stack ?? null,
      componentStack: info?.componentStack ?? null,
      zustandState: storeSnapshot,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = JSON.stringify(payload, null, 2);
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      this.setState({ copied: true });
    }
  };

  private reload = () => window.location.reload();

  render() {
    if (!this.state.error) return this.props.children;

    const { error, info, copied } = this.state;

    return (
      <div className="min-h-screen flex items-center justify-center p-6"
           style={{ background: "#0a0a0a", color: "#f5f5f5" }}>
        <div className="w-full max-w-2xl rounded-xl border p-8"
             style={{ background: "#141414", borderColor: "#2a2a2a", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#ef4444", boxShadow: "0 0 12px #ef4444" }} />
            <h1 className="text-lg font-semibold tracking-tight">Application crashed</h1>
          </div>
          <p className="text-sm mb-5" style={{ color: "#a3a3a3" }}>
            Something went wrong rendering this view. Copy the error log below and share it for debugging.
          </p>

          <div className="rounded-lg p-4 mb-5 overflow-auto max-h-64 text-xs font-mono"
               style={{ background: "#0a0a0a", border: "1px solid #2a2a2a", color: "#e5e5e5" }}>
            <div className="mb-2" style={{ color: "#fca5a5" }}>{error.name}: {error.message}</div>
            {error.stack && (
              <pre className="whitespace-pre-wrap" style={{ color: "#a3a3a3" }}>
                {error.stack.split("\n").slice(0, 6).join("\n")}
              </pre>
            )}
            {info?.componentStack && (
              <pre className="whitespace-pre-wrap mt-2" style={{ color: "#737373" }}>
                {info.componentStack.split("\n").slice(0, 6).join("\n")}
              </pre>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={this.copyLog}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: copied ? "#16a34a" : "#f5f5f5", color: copied ? "#fff" : "#0a0a0a" }}
            >
              {copied ? "Copied ✓" : "Copy Error Log"}
            </button>
            <button
              type="button"
              onClick={this.reload}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors border"
              style={{ background: "transparent", borderColor: "#2a2a2a", color: "#f5f5f5" }}
            >
              Reload app
            </button>
          </div>
        </div>
      </div>
    );
  }
}
