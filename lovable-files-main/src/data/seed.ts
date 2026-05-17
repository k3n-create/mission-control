// First-login seeding: idempotent. Runs against the supabaseAdapter on auth.
import { supabase } from "@/lib/supabase";

/**
 * Mark the profile as having completed first-login setup without inserting demo data.
 */
export async function seedIfFirstLogin(userId: string): Promise<void> {
  // Authoritative gate: only seed if the profile has never been seeded.
  // This survives the user deleting all their demo data — we won't re-create it.
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("has_seeded")
    .eq("id", userId)
    .maybeSingle();
  if (profErr) throw profErr;
  if (profile?.has_seeded) return;

  // Initial settings row
  await supabase.from("settings").upsert(
    {
      user_id: userId,
      commission_rate: 0.25,
      target_margin: 65,
      critical_threshold: 20,
    },
    { onConflict: "user_id" }
  );

  // Mark profile as seeded so we never re-seed, even if the user deletes data.
  const { error: markErr } = await supabase
    .from("profiles")
    .update({ has_seeded: true, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (markErr) throw markErr;
}
