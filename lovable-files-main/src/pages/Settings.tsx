import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAppStore } from "@/data/store";
import { useAuth } from "@/auth/AuthProvider";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function Settings() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const { user, signOut } = useAuth();

  const [commission, setCommission] = useState(settings.commissionRate * 100);
  const [target, setTarget] = useState(settings.targetMargin);
  const [critical, setCritical] = useState(settings.criticalThreshold);
  const [savingBiz, setSavingBiz] = useState(false);
  const [bizMsg, setBizMsg] = useState<string | null>(null);

  // Profile
  const [displayName, setDisplayName] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  useEffect(() => {
    setCommission(settings.commissionRate * 100);
    setTarget(settings.targetMargin);
    setCritical(settings.criticalThreshold);
  }, [settings]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles")
      .select("display_name,restaurant_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setDisplayName(data?.display_name ?? "");
        setRestaurantName(data?.restaurant_name ?? "");
      });
  }, [user]);

  const saveBiz = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingBiz(true); setBizMsg(null);
    try {
      await updateSettings({
        commissionRate: commission / 100,
        targetMargin: target,
        criticalThreshold: critical,
      });
      setBizMsg("Saved.");
    } finally { setSavingBiz(false); }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true); setProfileMsg(null);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      display_name: displayName || null,
      restaurant_name: restaurantName || null,
      updated_at: new Date().toISOString(),
    });
    setSavingProfile(false);
    setProfileMsg(error ? error.message : "Saved.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground mb-1">Settings</h1>
        <p className="text-[13px] text-muted-foreground">
          Configure your business thresholds and account profile.
        </p>
      </div>

      <form onSubmit={saveProfile} className="panel space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Display name">
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="input" />
          </Field>
          <Field label="Restaurant name">
            <input value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} className="input" />
          </Field>
          <Field label="Email"><input value={user?.email ?? ""} disabled className="input opacity-60" /></Field>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={savingProfile} className="btn btn-primary !py-1.5 !px-3 !text-[13px]">
            {savingProfile ? "Saving…" : "Save profile"}
          </button>
          {profileMsg && <span className="text-[12px] text-muted-foreground">{profileMsg}</span>}
        </div>
      </form>

      <form onSubmit={saveBiz} className="panel space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Margin & pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Delivery commission (%)">
            <input type="number" min={0} max={100} step={0.1}
              value={commission} onChange={(e) => setCommission(Number(e.target.value))}
              className="input" />
          </Field>
          <Field label="Target margin (%)">
            <input type="number" min={0} max={100} step={0.1}
              value={target} onChange={(e) => setTarget(Number(e.target.value))}
              className="input" />
          </Field>
          <Field label="Critical threshold (%)">
            <input type="number" min={0} max={100} step={0.1}
              value={critical} onChange={(e) => setCritical(Number(e.target.value))}
              className="input" />
          </Field>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={savingBiz} className="btn btn-primary !py-1.5 !px-3 !text-[13px]">
            {savingBiz ? "Saving…" : "Save settings"}
          </button>
          {bizMsg && <span className="text-[12px] text-muted-foreground">{bizMsg}</span>}
        </div>
      </form>

      <SecurityPanel email={user?.email ?? ""} />

      <div className="panel">
        <h2 className="text-sm font-semibold text-foreground mb-2">Account</h2>
        <button
          type="button"
          onClick={() => signOut()}
          className="px-3 py-1.5 border border-border rounded text-[13px] text-foreground hover:bg-surface-light"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

function SecurityPanel({ email }: { email: string }) {
  const [sending, setSending] = useState(false);

  const sendReset = async () => {
    if (!isSupabaseConfigured) {
      toast.message("Preview mode", {
        description: "Reset emails only work on Railway with Supabase env vars set.",
      });
      return;
    }
    if (!email) {
      toast.error("No email on file");
      return;
    }
    setSending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSending(false);
    if (error) {
      toast.error("Could not send reset email", { description: error.message });
      return;
    }
    toast.success("Reset email sent", {
      description: "Check your inbox for the link.",
    });
  };

  return (
    <div className="panel space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Security</h2>
        <p className="text-[12px] text-muted-foreground mt-1">
          Send a password reset email to your account address. The link will open the password update page.
        </p>
      </div>
      <Field label="Account email">
        <input value={email} disabled className="input opacity-60" />
      </Field>
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={sendReset}
          disabled={sending}
          className="btn btn-primary !py-1.5 !px-3 !text-[13px]"
        >
          {sending ? "Sending…" : "Send password reset email"}
        </button>
        <Link
          to="/reset-password"
          className="text-[12px] text-muted-foreground underline hover:text-foreground"
        >
          Open reset password page
        </Link>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[12px] font-semibold text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}
