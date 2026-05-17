import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Bot } from "lucide-react";

type Mode = "signin" | "signup" | "forgot";

export default function Login() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const reset = () => { setMsg(null); setErr(null); };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault(); reset(); setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setMsg("Check your inbox to confirm your email.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setMsg("Password reset email sent.");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    reset();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) setErr(error.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md panel">
        <div className="flex items-center gap-2 mb-6 text-foreground font-extrabold text-lg">
          <Bot className="h-5 w-5" />
          AGENTIC LABS <span className="text-primary">| TRACKER</span>
        </div>

        <h1 className="text-base font-semibold text-foreground mb-1">
          {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Reset password"}
        </h1>
        <p className="text-[13px] text-muted-foreground mb-5">
          {mode === "signin"
            ? "Welcome back. Sign in to your tracker."
            : mode === "signup"
            ? "Create your tenant. Initial data will be seeded on first login."
            : "We'll email you a password reset link."}
        </p>

        <form onSubmit={handleEmail} className="space-y-3">
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground">Email</label>
            <input
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded text-sm bg-surface text-foreground"
            />
          </div>

          {mode !== "forgot" && (
            <div>
              <label className="text-[12px] font-semibold text-muted-foreground">Password</label>
              <input
                type="password" required minLength={6} value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded text-sm bg-surface text-foreground"
              />
            </div>
          )}

          {err && <div className="text-[12px] text-danger">{err}</div>}
          {msg && <div className="text-[12px] text-success">{msg}</div>}

          <button type="submit" disabled={busy} className="btn btn-primary w-full !py-2 !text-[13px]">
            {busy ? "Working…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Sign up" : "Send reset link"}
          </button>
        </form>

        {mode !== "forgot" && (
          <>
            <div className="my-4 flex items-center gap-3 text-[11px] text-muted-foreground">
              <div className="flex-1 h-px bg-border" />
              OR
              <div className="flex-1 h-px bg-border" />
            </div>
            <button onClick={handleGoogle} type="button"
              className="w-full px-3 py-2 border border-border rounded text-sm bg-surface text-foreground hover:bg-surface-light">
              Continue with Google
            </button>
          </>
        )}

        <div className="mt-5 text-[12px] text-muted-foreground flex justify-between">
          {mode === "signin" ? (
            <>
              <button onClick={() => { reset(); setMode("signup"); }} className="underline">Create account</button>
              <button onClick={() => { reset(); setMode("forgot"); }} className="underline">Forgot password?</button>
            </>
          ) : (
            <button onClick={() => { reset(); setMode("signin"); }} className="underline">Back to sign in</button>
          )}
        </div>
      </div>
    </div>
  );
}
