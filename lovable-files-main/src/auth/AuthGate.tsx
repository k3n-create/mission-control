import { useState, type ReactNode } from "react";
import { useAuth } from "./AuthProvider";
import { isSupabaseConfigured } from "@/lib/supabase";
import Login from "@/pages/Login";

function PreviewBanner() {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <div className="sticky top-0 z-50 border-b border-border bg-surface-light px-4 py-2 flex items-center justify-between gap-3 text-[12px]">
      <span className="text-muted-foreground">
        <span className="font-semibold text-danger">Backend not connected</span>
        {" — running in preview mode with mock data. Set "}
        <code className="text-foreground">VITE_SUPABASE_URL</code>
        {" and "}
        <code className="text-foreground">VITE_SUPABASE_ANON_KEY</code>
        {" in Railway to go live."}
      </span>
      <button
        type="button"
        onClick={() => setHidden(true)}
        className="text-muted-foreground hover:text-foreground px-2 py-0.5"
        aria-label="Dismiss preview banner"
      >
        ×
      </button>
    </div>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  // Preview mode: no Supabase env vars. Render the app with a banner so
  // Visual Edits can target the real components.
  if (!isSupabaseConfigured) {
    return (
      <>
        <PreviewBanner />
        {children}
      </>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!session) return <Login />;

  return <>{children}</>;
}
