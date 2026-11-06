/* NautilusClaw — Supabase data layer  →  window.NautilusDB
 *
 * Load order in each page (before this file):
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *   <script src="supabase-config.js"></script>
 *   <script src="db.js"></script>
 *
 * If Supabase isn't configured yet, window.NautilusDB is null and callers
 * fall back to the existing localStorage behaviour — nothing breaks.
 */
(function () {
  const cfg = window.SUPABASE_CONFIG;
  if (!cfg || !cfg.url || cfg.url.includes("YOUR-PROJECT") || !window.supabase) {
    console.info("[NautilusDB] Supabase not configured — using local storage.");
    window.NautilusDB = null;
    return;
  }

  const client = window.supabase.createClient(cfg.url, cfg.anonKey);

  window.NautilusDB = {
    client,

    /* ---- auth (Supabase Auth replaces the localStorage SHA-256 fiction) ---- */
    signUp: (email, password, name) =>
      client.auth.signUp({ email, password, options: { data: { name } } }),
    signIn: (email, password) =>
      client.auth.signInWithPassword({ email, password }),
    signOut: () => client.auth.signOut(),
    getUser: async () => (await client.auth.getUser()).data?.user || null,
    onAuthChange: (cb) =>
      client.auth.onAuthStateChange((_evt, session) => cb(session?.user || null)),
    /* GDPR Article 17 — RLS cascades the delete to all of this family's rows. */
    eraseAccount: async () => {
      const u = (await client.auth.getUser()).data?.user;
      if (!u) return;
      await client.from("parent").delete().eq("id", u.id); // cascades child/message/concern/summary
      await client.auth.signOut();
    },

    /* ---- children ---- */
    listChildren: () => client.from("child").select("*").order("created_at"),
    addChild: (display_name, age_band) =>
      client.from("child").insert({ display_name, age_band }).select().single(),

    /* ---- messages ---- */
    addMessage: (child_id, role, text, emotion, safety_flag) =>
      client.from("message").insert({ child_id, role, text, emotion, safety_flag }).select().single(),
    listMessages: (child_id, limit = 200) =>
      client.from("message").select("*").eq("child_id", child_id)
        .order("created_at", { ascending: true }).limit(limit),

    /* ---- concerns ---- */
    addConcern: (child_id, type, trigger, message_id = null) =>
      client.from("concern").insert({ child_id, type, trigger, message_id }).select().single(),
    listConcerns: (child_id) =>
      client.from("concern").select("*").eq("child_id", child_id)
        .order("created_at", { ascending: false }),

    /* ---- summaries ---- */
    addSummary: (child_id, period_start, period_end, content_json) =>
      client.from("summary").insert({ child_id, period_start, period_end, content_json }).select().single(),
    listSummaries: (child_id) =>
      client.from("summary").select("*").eq("child_id", child_id)
        .order("period_end", { ascending: false }),
  };

  console.info("[NautilusDB] Supabase ready.");
})();
