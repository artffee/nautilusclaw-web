/* NautilusClaw — Supabase config.
 *
 * 1. Copy this file to `supabase-config.js`.
 * 2. Fill in your project's URL and anon (public) key
 *    (Supabase Dashboard > Project Settings > API).
 *
 * Both values are PUBLIC and safe to ship in the browser — Row-Level Security
 * is what actually protects the data. NEVER put the `service_role` key in
 * client code; it bypasses RLS and belongs only in server functions.
 */
window.SUPABASE_CONFIG = {
  url: "https://YOUR-PROJECT-REF.supabase.co",
  anonKey: "YOUR-ANON-PUBLIC-KEY",
};
