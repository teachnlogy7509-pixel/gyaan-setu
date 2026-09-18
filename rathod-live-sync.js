(() => {
  const URL = "https://oicluhfdvaroqvhwfwyp.supabase.co";
  const KEY = "sb_publishable_iXAoOGZ0YppBP0Y1kJf02Q_E323DzKA";
  let db;
  let session;
  let bound = false;
  const $ = (s) => document.querySelector(s);
  const toast = (text) => { const node = $("#toast"); if (node) { node.textContent = text; node.classList.add("show"); setTimeout(() => node.classList.remove("show"), 2600); } };
  async function bridge(action, extra = {}) {
    if (!db) return { error: { message: "Sync client unavailable" } };
    const current = await db.auth.getSession(); session = current.data.session;
    if (!session) return { error: { message: "Login required" } };
    const response = await fetch(`${URL}/functions/v1/gyaan-rathod-sync`, { method: "POST", headers: { apikey: KEY, Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ action, ...extra }) });
    const result = await response.json().catch(() => ({}));
    return response.ok ? { data: result } : { error: { message: result.error || "RATHOD sync failed" } };
  }
  function showProgress(result) {
    if (result?.error) return;
    const data = result.data || result;
    if ($("#rhccXp")) $("#rhccXp").textContent = `${Number(data.xp || 0)} XP`;
    if ($("#rhccScore")) $("#rhccScore").textContent = `${Number(data.score ?? data.season_xp ?? 0)}`;
    if ($("#rhSeasonXp")) $("#rhSeasonXp").textContent = `${Number(data.season_xp ?? data.score ?? 0)}`;
    if ($("#rhSharedStatus")) $("#rhSharedStatus").textContent = `RATHOD HUB live sync connected · Level ${data.league_level || 1}`;
  }
  async function syncProgress() { const result = await bridge("sync_progress"); if (result.data) showProgress(result); }
  async function redeemCoupon(event) {
    event.preventDefault(); event.stopImmediatePropagation();
    const code = $("#rhccVipCode")?.value.trim().toUpperCase() || $("#rhCouponInput")?.value.trim().toUpperCase();
    if (!code) return toast("VIP coupon code डालें.");
    const result = await bridge("redeem_coupon", { code });
    if (result.error) return toast(result.error.message);
    toast(result.data?.success ? "RATHOD VIP access unlocked ✓" : (result.data?.error || "Coupon invalid"));
    if (result.data?.success) { if ($("#rhccVipStatus")) $("#rhccVipStatus").textContent = `RATHOD VIP active until ${new Date(result.data.expires_at).toLocaleDateString()}.`; if ($("#rhccVipCode")) $("#rhccVipCode").value = ""; }
  }
  async function uploadAndPost(event) {
    event.preventDefault(); event.stopImmediatePropagation();
    if (!session) return toast("Pehle GyaanSetu login karein.");
    const text = $("#rhccPostText")?.value.trim(); const file = $("#rhccPostFile")?.files?.[0];
    if (!text && !file) return toast("Post text या photo चुनें.");
    const enrollment = await db.from("batch_enrollments").select("batch_id").eq("user_id", session.user.id).eq("status", "active").order("enrolled_at", { ascending: true }).limit(1).maybeSingle();
    if (!enrollment.data) return toast("Enrolled batch के बाद post करें.");
    const section = await db.from("sections").select("id").eq("batch_id", enrollment.data.batch_id).eq("type", "community").maybeSingle();
    if (!section.data) return toast("Community section नहीं मिला.");
    let media_url = null; let media_type = null;
    if (file) { if (file.size > 8 * 1024 * 1024) return toast("Photo maximum 8 MB रखें."); const path = `${session.user.id}/community/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]+/g, "-")}`; const upload = await db.storage.from("gyaan-media").upload(path, file, { upsert: false, contentType: file.type }); if (upload.error) return toast(upload.error.message); media_url = db.storage.from("gyaan-media").getPublicUrl(path).data.publicUrl; media_type = file.type; }
    const profile = await db.from("profiles").select("name,display_name").eq("id", session.user.id).maybeSingle();
    const post = await db.from("posts").insert({ section_id: section.data.id, user_id: session.user.id, author_name: profile.data?.name || profile.data?.display_name || session.user.email?.split("@")[0] || "Learner", initials: "GS", content: text || "📷 Shared a study photo", media_url, media_type }).select("id").single();
    if (post.error) return toast(post.error.message);
    const mirrored = await bridge("community_post", { content: text || "📷 Shared a study photo", media_url, media_type, gyaan_post_id: post.data.id });
    $("#rhccPostText").value = ""; $("#rhccPostFile").value = "";
    toast(mirrored.error ? "GyaanSetu post saved; RATHOD mirror unavailable." : "Post shared + RATHOD HUB synced ✓");
    window.rathodCompat?.loadCommunity?.();
  }
  function bindCommunityMirror() {
    if (bound) return true;
    const postButton = $("#rhccSubmitPost"); const vipButton = $("#rhccVipButton");
    if (!postButton || !vipButton) return false;
    postButton.addEventListener("click", uploadAndPost, true);
    vipButton.addEventListener("click", redeemCoupon, true);
    const feed = $("#rhccFeed");
    feed?.addEventListener("click", (event) => { const button = event.target.closest("[data-rh-react]"); if (button) bridge("community_reaction", { gyaan_post_id: button.dataset.rhReact, reaction_type: button.dataset.rhType }); }, true);
    bound = true; return true;
  }
  async function init() {
    const mod = await import("https://esm.sh/@supabase/supabase-js@2"); db = mod.createClient(URL, KEY);
    const current = await db.auth.getSession(); session = current.data.session;
    db.auth.onAuthStateChange(async (_event, newSession) => { session = newSession; if (session) await syncProgress(); });
    const timer = setInterval(async () => { bindCommunityMirror(); if (session) await syncProgress(); }, 30000);
    void timer;
    setTimeout(bindCommunityMirror, 700); setTimeout(bindCommunityMirror, 1800); await syncProgress();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(init, 900), { once: true }); else setTimeout(init, 900);
})();
