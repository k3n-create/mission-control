import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function ResetPassword() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (pw.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }
    if (pw !== confirm) {
      setErr("Passwords do not match.");
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);

    if (error) {
      setErr(error.message);
      toast.error("Could not update password", { description: error.message });
      return;
    }

    toast.success("Password updated", {
      description: "You're all set. Redirecting to your dashboard…",
    });
    setTimeout(() => nav("/", { replace: true }), 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md panel">
        <h1 className="text-base font-semibold text-foreground mb-1">Set a new password</h1>
        <p className="text-[12px] text-muted-foreground mb-4">
          Choose a strong password you haven't used before.
        </p>
        {!ready ? (
          <p className="text-[13px] text-muted-foreground">Verifying recovery link…</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <span className="block text-[12px] font-semibold text-muted-foreground mb-1">
                New password
              </span>
              <input
                type="password"
                required
                minLength={6}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3 py-2 border border-border rounded text-sm bg-surface text-foreground"
              />
            </label>
            <label className="block">
              <span className="block text-[12px] font-semibold text-muted-foreground mb-1">
                Confirm password
              </span>
              <input
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-3 py-2 border border-border rounded text-sm bg-surface text-foreground"
              />
            </label>
            {err && <div className="text-[12px] text-danger">{err}</div>}
            <button
              disabled={busy}
              className="btn btn-primary w-full !py-2 !text-[13px]"
            >
              {busy ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
