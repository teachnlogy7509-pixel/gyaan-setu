(() => {
  const GYAAN_URL = "https://oicluhfdvaroqvhwfwyp.supabase.co";
  const GYAAN_KEY = "sb_publishable_iXAoOGZ0YppBP0Y1kJf02Q_E323DzKA";
  const RATHOD_URL = "https://fezyljxjbgefaqroxorl.supabase.co";
  const RATHOD_KEY = "sb_publishable_UQ0y1axzT6jsesDmz1JHPA_j2budIh3";
  const REACTIONS = [
    ["like", "👍"], ["love", "❤️"], ["helpful", "💡"], ["fire", "🔥"], ["celebrate", "🎉"]
  ];
  let db;
  let rhDb;
  let session;
  let compatPosts = [];
  let activeEnrollment;

  const $ = (s, root = document) => root.querySelector(s);
  const esc = (v) => String(v ?? "").replace(/[&<>\"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const safeUrl = (value) => { try { const u = new URL(String(value || "")); return /^https?:$/.test(u.protocol) ? u.href : ""; } catch { return ""; } };
  const initials = (name) => String(name || "Learner").trim().split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase() || "GS";
  const toast = (text) => { const node = $("#toast"); if (node) { node.textContent = text; node.classList.add("show"); setTimeout(() => node.classList.remove("show"), 2800); } };
  const mediaName = (file) => `${Date.now()}-${String(file.name || "upload").replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-100)}`;

  function addStyles() {
    if ($("#rathodCompatStyles")) return;
    const style = document.createElement("style");
    style.id = "rathodCompatStyles";
    style.textContent = `
      #rathodCommandCenter{margin:0 0 22px;border-radius:18px;padding:18px;color:#fff;background:linear-gradient(135deg,#07090d 0%,#182536 58%,#34131b 100%);box-shadow:0 18px 45px rgba(10,18,30,.22);border:1px solid rgba(239,43,43,.28)}
      #rathodCommandCenter .rhcc-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap}
      #rathodCommandCenter .rhcc-kicker{font-size:9px;letter-spacing:.17em;font-weight:900;color:#ff8585;text-transform:uppercase}
      #rathodCommandCenter h2{margin:3px 0 2px;font-size:23px;letter-spacing:-.7px;color:#fff}
      #rathodCommandCenter p{margin:0;color:#b9c3cc;font-size:11px}
      #rathodCommandCenter .rhcc-badge{border:1px solid rgba(34,211,238,.35);background:rgba(34,211,238,.1);color:#8eeafe;border-radius:999px;padding:7px 10px;font-size:9px;font-weight:900;white-space:nowrap}
      #rathodCommandCenter .rhcc-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-top:15px}
      #rathodCommandCenter .rhcc-metric{border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.06);border-radius:12px;padding:11px;min-width:0}
      #rathodCommandCenter .rhcc-metric small{display:block;color:#9eabb7;font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}
      #rathodCommandCenter .rhcc-metric b{display:block;margin-top:4px;color:#fff;font-size:19px}
      #rathodCommandCenter .rhcc-grid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(260px,.8fr);gap:12px;margin-top:12px}
      #rathodCommandCenter .rhcc-panel{border:1px solid rgba(255,255,255,.12);background:rgba(3,7,12,.55);border-radius:13px;padding:13px;min-width:0}
      #rathodCommandCenter .rhcc-panel h3{color:#fff;font-size:13px;margin:0 0 9px}
      #rathodCommandCenter .rhcc-materials{display:grid;gap:7px;max-height:250px;overflow:auto}
      #rathodCommandCenter .rhcc-material{display:flex;align-items:center;gap:9px;padding:9px;border-radius:10px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08)}
      #rathodCommandCenter .rhcc-material>div{min-width:0;flex:1}.rhcc-material b{display:block;color:#fff;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rhcc-material small{display:block;color:#a7b1bc;font-size:9px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #rathodCommandCenter .rhcc-material a{background:#ef2b2b;color:#fff;border-radius:8px;padding:7px 9px;font-size:9px;font-weight:900;white-space:nowrap;text-decoration:none}
      #rathodCommandCenter .rhcc-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.rhcc-btn{border:0;border-radius:9px;background:#ef2b2b;color:#fff;padding:9px 11px;font-size:10px;font-weight:900}.rhcc-btn.alt{background:#0e1620;border:1px solid rgba(255,255,255,.15)}
      #rhCompatCommunity{margin:15px 0;padding:15px;border-radius:15px;background:linear-gradient(135deg,#081018,#1c1420);border:1px solid rgba(239,43,43,.3);color:#fff}
      #rhCompatCommunity .rhcc-feed{display:grid;gap:9px;margin-top:10px}.rhcc-post{border:1px solid rgba(255,255,255,.11);background:rgba(255,255,255,.06);border-radius:12px;padding:11px}.rhcc-post-head{display:flex;align-items:center;gap:8px}.rhcc-avatar{width:31px;height:31px;border-radius:50%;display:grid;place-items:center;overflow:hidden;background:#394957;color:#fff;font-size:9px;font-weight:900;flex:none}.rhcc-avatar img{width:100%;height:100%;object-fit:cover}.rhcc-post-meta{min-width:0;flex:1}.rhcc-post-meta b{display:block;color:#fff;font-size:11px}.rhcc-post-meta small{display:block;color:#8f9aa5;font-size:8px}.rhcc-post-body{margin:9px 0;color:#d4dbe1;font-size:11px;line-height:1.55;white-space:pre-wrap}.rhcc-post-body img{max-width:100%;max-height:240px;border-radius:10px;display:block;margin-top:8px}.rhcc-reactions{display:flex;gap:5px;flex-wrap:wrap;border-top:1px solid rgba(255,255,255,.1);padding-top:8px}.rhcc-reactions button{border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.18);color:#b9c3cc;border-radius:999px;padding:5px 7px;font-size:10px}.rhcc-reactions button.active{border-color:#ef2b2b;background:rgba(239,43,43,.18);color:#fff}.rhcc-compose{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:10px}.rhcc-compose textarea,.rhcc-compose input{width:100%;border:1px solid rgba(255,255,255,.15);background:#05080d;color:#fff;border-radius:9px;padding:9px;font-size:11px}.rhcc-compose textarea{min-height:58px;resize:vertical}.rhcc-compose .rhcc-file{grid-column:1/-1;color:#9ca8b3;font-size:10px}.rhcc-muted{color:#9ca8b3;font-size:10px}.rhcc-vip{display:flex;gap:8px;align-items:center;margin-top:9px}.rhcc-vip input{flex:1;min-width:0;border:1px solid rgba(34,211,238,.25);background:#05080d;color:#fff;border-radius:9px;padding:9px;font-size:11px;text-transform:uppercase}.rhcc-vip button{border:0;border-radius:9px;background:linear-gradient(90deg,#0891b2,#7c3aed);color:#fff;padding:9px 11px;font-size:10px;font-weight:900}
      @media(max-width:720px){#rathodCommandCenter .rhcc-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}#rathodCommandCenter .rhcc-grid{display:block}#rathodCommandCenter .rhcc-panel+ .rhcc-panel{margin-top:10px}.rhcc-compose{grid-template-columns:1fr}.rhcc-compose button{width:100%}}
    `;
    document.head.appendChild(style);
  }

  async function initClients() {
    const mod = await import("https://esm.sh/@supabase/supabase-js@2");
    db = mod.createClient(GYAAN_URL, GYAAN_KEY);
    rhDb = mod.createClient(RATHOD_URL, RATHOD_KEY);
    const { data } = await db.auth.getSession();
    session = data.session;
  }

  async function loadEnrollment() {
    if (!session?.user) return null;
    const { data } = await db.from("batch_enrollments").select("batch_id,role,status").eq("user_id", session.user.id).eq("status", "active").order("enrolled_at", { ascending: true }).limit(1).maybeSingle();
    activeEnrollment = data || null;
    return activeEnrollment;
  }

  async function loadProfile() {
    if (!session?.user) return {};
    const { data } = await db.from("profiles").select("id,display_name,name,email,avatar_url,pfp_url,bio,xp,streak_days,level,role,saka_score").eq("id", session.user.id).maybeSingle();
    return data || {};
  }

  function profileAvatar(profile, size = 31) {
    const url = safeUrl(profile?.pfp_url || profile?.avatar_url);
    return url ? `<img src="${esc(url)}" alt="profile">` : esc(initials(profile?.name || profile?.display_name || session?.user?.email));
  }

  async function loadMaterialRows() {
    let rows = [];
    try {
      const result = await rhDb.from("posts").select("id,title,desc,file_name,file_url,category,created_at,is_material").eq("is_material", true).order("created_at", { ascending: false }).limit(80);
      if (!result.error) rows = result.data || [];
    } catch (error) { console.info("RATHOD material read skipped", error); }
    if (!rows.length) {
      try {
        const result = await db.from("rathod_materials").select("id,title,description,file_name,file_url,category,created_at").order("created_at", { ascending: false }).limit(80);
        if (!result.error) rows = (result.data || []).map((x) => ({ ...x, desc: x.description }));
      } catch (error) { console.info("Gyaan material mirror read skipped", error); }
    }
    return rows;
  }

  function renderMaterialRows(rows) {
    const box = $("#rhccMaterials");
    if (!box) return;
    box.innerHTML = rows.length ? rows.slice(0, 40).map((row) => {
      const url = safeUrl(row.file_url || row.fileUrl);
      const label = row.file_name || row.fileName || row.desc || row.title || "Study material";
      return `<div class="rhcc-material"><div><b>${esc(row.title || row.category || "RATHOD HUB Material")}</b><small>${esc(row.category || "Study")}${label ? ` · ${esc(label)}` : ""}</small></div>${url ? `<a href="${esc(url)}" target="_blank" rel="noopener">Open PDF</a>` : "<small>No file link</small>"}</div>`;
    }).join("") : `<div class="rhcc-muted">RATHOD material source अभी empty या protected है. Admin mirror sync चलाएँ.</div>`;
    $("#rhccMaterialCount").textContent = `${rows.length} migrated links`;
  }

  async function loadCompatPosts() {
    const feed = $("#rhccFeed");
    if (!feed || !session?.user || !activeEnrollment) { if (feed) feed.innerHTML = `<div class="rhcc-muted">Login करके enrolled batch में community खोलें.</div>`; return; }
    const { data: section } = await db.from("sections").select("id").eq("batch_id", activeEnrollment.batch_id).eq("type", "community").maybeSingle();
    if (!section) { feed.innerHTML = `<div class="rhcc-muted">इस batch का community section अभी configure नहीं है.</div>`; return; }
    const { data: posts, error } = await db.from("posts").select("id,content,created_at,user_id,author_name,initials,media_url,media_type").eq("section_id", section.id).order("created_at", { ascending: false }).limit(30);
    if (error) { feed.innerHTML = `<div class="rhcc-muted">Community load नहीं हो पाई: ${esc(error.message)}</div>`; return; }
    compatPosts = posts || [];
    const ids = compatPosts.map((x) => x.user_id).filter(Boolean);
    const profiles = ids.length ? await db.from("profiles").select("id,name,display_name,avatar_url,pfp_url").in("id", ids) : { data: [] };
    const profileMap = Object.fromEntries((profiles.data || []).map((x) => [String(x.id), x]));
    const reactions = compatPosts.length ? await db.from("post_reactions").select("post_id,user_id,reaction_type").in("post_id", compatPosts.map((x) => x.id)) : { data: [] };
    const grouped = {};
    (reactions.data || []).forEach((r) => { grouped[r.post_id] ||= []; grouped[r.post_id].push(r); });
    feed.innerHTML = compatPosts.length ? compatPosts.map((post) => {
      const p = profileMap[String(post.user_id)] || {};
      const rs = grouped[post.id] || [];
      const media = safeUrl(post.media_url);
      return `<article class="rhcc-post"><div class="rhcc-post-head"><span class="rhcc-avatar">${profileAvatar(p)}</span><div class="rhcc-post-meta"><b>${esc(post.author_name || p.name || p.display_name || "Learner")}</b><small>${new Date(post.created_at).toLocaleString()} · GyaanSetu Community</small></div></div><div class="rhcc-post-body">${esc(post.content)}${media && String(post.media_type || "").startsWith("image/") ? `<img src="${esc(media)}" alt="post image">` : media ? `<p><a href="${esc(media)}" target="_blank" rel="noopener" style="color:#8eeafe">Open attachment</a></p>` : ""}</div><div class="rhcc-reactions">${REACTIONS.map(([type, emoji]) => { const count = rs.filter((x) => x.reaction_type === type).length; const mine = rs.some((x) => x.user_id === session.user.id && x.reaction_type === type); return `<button class="${mine ? "active" : ""}" data-rh-react="${esc(post.id)}" data-rh-type="${type}">${emoji} ${count || ""}</button>`; }).join("")}<button data-rh-comment="${esc(post.id)}">💬 Comment</button></div></article>`;
    }).join("") : `<div class="rhcc-muted">Abhi koi post नहीं. Apna first community post डालें.</div>`;
    feed.querySelectorAll("[data-rh-react]").forEach((button) => button.addEventListener("click", () => toggleReaction(button.dataset.rhReact, button.dataset.rhType)));
    feed.querySelectorAll("[data-rh-comment]").forEach((button) => button.addEventListener("click", () => addComment(button.dataset.rhComment)));
  }

  async function toggleReaction(postId, type) {
    if (!session?.user) return toast("Pehle login karein.");
    const existing = await db.from("post_reactions").select("post_id").eq("post_id", postId).eq("user_id", session.user.id).eq("reaction_type", type).maybeSingle();
    const result = existing.data ? await db.from("post_reactions").delete().eq("post_id", postId).eq("user_id", session.user.id).eq("reaction_type", type) : await db.from("post_reactions").insert({ post_id: postId, user_id: session.user.id, reaction_type: type });
    if (result.error) return toast(result.error.message);
    await loadCompatPosts();
  }

  async function addComment(postId) {
    if (!session?.user) return toast("Pehle login karein.");
    const content = window.prompt("Comment / reply लिखें:");
    if (!content?.trim()) return;
    const result = await db.from("comments").insert({ post_id: postId, user_id: session.user.id, author_name: session.user.email?.split("@")[0] || "Learner", content: content.trim() });
    if (result.error) return toast(result.error.message);
    toast("Comment added ✓");
  }

  async function submitCompatPost() {
    if (!session?.user || !activeEnrollment) return toast("Enrolled account से login करें.");
    const text = $("#rhccPostText")?.value.trim();
    const file = $("#rhccPostFile")?.files?.[0];
    if (!text && !file) return toast("Post text या photo चुनें.");
    const { data: section } = await db.from("sections").select("id").eq("batch_id", activeEnrollment.batch_id).eq("type", "community").maybeSingle();
    if (!section) return toast("Community section नहीं मिला.");
    let media_url = null; let media_type = null;
    if (file) {
      if (file.size > 8 * 1024 * 1024) return toast("Photo maximum 8 MB रखें.");
      const path = `${session.user.id}/community/${mediaName(file)}`;
      const uploaded = await db.storage.from("gyaan-media").upload(path, file, { upsert: false, contentType: file.type });
      if (uploaded.error) return toast(uploaded.error.message);
      media_url = db.storage.from("gyaan-media").getPublicUrl(path).data.publicUrl; media_type = file.type;
    }
    const profile = await loadProfile();
    const result = await db.from("posts").insert({ section_id: section.id, user_id: session.user.id, author_name: profile.name || profile.display_name || session.user.email?.split("@")[0] || "Learner", initials: initials(profile.name || profile.display_name), content: text || "📷 Shared a study photo", media_url, media_type });
    if (result.error) return toast(result.error.message);
    $("#rhccPostText").value = ""; $("#rhccPostFile").value = ""; toast("Post shared ✓"); await loadCompatPosts();
  }

  async function redeemVip() {
    const code = $("#rhccVipCode")?.value.trim().toUpperCase();
    if (!code || !session?.user) return toast("Login करके coupon code डालें.");
    const result = await db.rpc("redeem_hub_coupon", { p_code: code });
    if (result.error) return toast(result.error.message);
    toast("VIP access unlocked ✓"); await updateCommandCenter();
  }

  async function updateCommandCenter() {
    const profile = await loadProfile();
    const name = profile.name || profile.display_name || session?.user?.email?.split("@")[0] || "Learner";
    const node = $("#rhccName"); if (node) node.textContent = name;
    const avatar = $("#rhccAvatar"); if (avatar) avatar.innerHTML = profileAvatar(profile, 38);
    $("#rhccXp").textContent = `${Number(profile.xp || 0)} XP`;
    $("#rhccScore").textContent = `${Number(profile.saka_score || 0)}`;
    $("#rhccStreak").textContent = `${Number(profile.streak_days || 0)} 🔥`;
    $("#rhccVipStatus").textContent = session?.user ? "VIP coupon access is active in this GyaanSetu database." : "Login to redeem VIP access.";
    const materials = await loadMaterialRows(); renderMaterialRows(materials);
    await loadCompatPosts();
  }

  function injectCommandCenter() {
    const dashboard = $("#dashboard");
    if (!dashboard || $("#rathodCommandCenter")) return;
    dashboard.insertAdjacentHTML("afterbegin", `<section id="rathodCommandCenter"><div class="rhcc-head"><div><div class="rhcc-kicker">RATHOD HUB COMPATIBILITY · GYAANSETU</div><h2>Welcome, <span id="rhccName">Learner</span> 🩺</h2><p>PW-style dashboard, shared XP, VIP access और migrated study vault.</p></div><div class="rhcc-badge"><span id="rhccAvatar" class="rhcc-avatar" style="display:inline-grid;vertical-align:middle;margin-right:5px;width:24px;height:24px"></span> PROFILE + PFP READY</div></div><div class="rhcc-metrics"><div class="rhcc-metric"><small>Total XP</small><b id="rhccXp">0 XP</b></div><div class="rhcc-metric"><small>Saka score</small><b id="rhccScore">0</b></div><div class="rhcc-metric"><small>Study streak</small><b id="rhccStreak">0 🔥</b></div><div class="rhcc-metric"><small>Access</small><b style="font-size:14px">VIP + Community</b></div></div><div class="rhcc-grid"><div class="rhcc-panel"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><h3>📚 RATHOD migrated material</h3><small id="rhccMaterialCount" class="rhcc-muted">Loading…</small></div><div id="rhccMaterials" class="rhcc-materials"><div class="rhcc-muted">Loading material links…</div></div></div><div class="rhcc-panel"><h3>🎟️ VIP / Coupon access</h3><div id="rhccVipStatus" class="rhcc-muted">Login to redeem access.</div><div class="rhcc-vip"><input id="rhccVipCode" placeholder="VIP coupon code"><button id="rhccVipButton">Unlock</button></div><div class="rhcc-actions"><button class="rhcc-btn alt" id="rhccProfileButton">Open profile / PFP</button><button class="rhcc-btn alt" id="rhccCommunityButton">Open community</button></div></div></div></section>`);
    $("#rhccVipButton").addEventListener("click", redeemVip); $("#rhccProfileButton").addEventListener("click", () => $("#account")?.click()); $("#rhccCommunityButton").addEventListener("click", () => document.querySelector('[data-view="community"]')?.click());
  }

  function injectCommunity() {
    const community = $("#community");
    if (!community || $("#rhCompatCommunity")) return;
    const anchor = $(".compose", community) || community.firstElementChild;
    const html = `<section id="rhCompatCommunity"><div class="rhcc-head"><div><div class="rhcc-kicker">RATHOD HUB SOCIAL COMMUNITY</div><h2 style="font-size:19px">Post, react, help 🤝</h2><p>Har learner apni photo, reaction और reply share कर सकता है.</p></div><button class="rhcc-btn alt" id="rhccRefreshFeed">Refresh</button></div><div class="rhcc-compose"><textarea id="rhccPostText" placeholder="Community post लिखें…"></textarea><button class="rhcc-btn" id="rhccSubmitPost">Post</button><input id="rhccPostFile" class="rhcc-file" type="file" accept="image/*"><small class="rhcc-muted">Photo max 8 MB · image bucket + RLS enabled</small></div><div id="rhccFeed" class="rhcc-feed"><div class="rhcc-muted">Login करने के बाद feed load होगा.</div></div></section>`;
    if (anchor) anchor.insertAdjacentHTML("beforebegin", html); else community.insertAdjacentHTML("afterbegin", html);
    $("#rhccSubmitPost").addEventListener("click", submitCompatPost); $("#rhccRefreshFeed").addEventListener("click", loadCompatPosts);
  }

  function patchAuthAndProfile() {
    const authForm = $("#authForm");
    if (authForm && !$("#rhccForgotPassword")) {
      const button = document.createElement("button"); button.type = "button"; button.id = "rhccForgotPassword"; button.className = "btn"; button.style.background = "#334155"; button.textContent = "Forgot password / पासवर्ड reset";
      button.addEventListener("click", async () => { const email = $("#email")?.value.trim(); if (!email) return toast("Email डालें."); const result = await db.auth.resetPasswordForEmail(email, { redirectTo: location.href }); toast(result.error ? result.error.message : "Password reset email भेज दिया गया."); });
      authForm.appendChild(button);
    }
    const profileForm = $("#profileForm");
    if (profileForm && !profileForm.dataset.rhCompatBound) {
      profileForm.dataset.rhCompatBound = "1";
      profileForm.addEventListener("submit", async (event) => {
        event.preventDefault(); event.stopImmediatePropagation();
        if (!session?.user) return toast("Pehle login karein.");
        const file = $("#photo")?.files?.[0]; let avatar_url = null;
        if (file) { const path = `${session.user.id}/avatar/${mediaName(file)}`; const upload = await db.storage.from("gyaan-media").upload(path, file, { upsert: false, contentType: file.type }); if (upload.error) return toast(upload.error.message); avatar_url = db.storage.from("gyaan-media").getPublicUrl(path).data.publicUrl; }
        const name = $("#name")?.value.trim() || "Learner";
        const result = await db.from("profiles").upsert({ id: session.user.id, display_name: name, name, email: session.user.email, ...(avatar_url ? { avatar_url, pfp_url: avatar_url } : {}) });
        if (result.error) return toast(result.error.message); $("#profile")?.classList.remove("show"); toast("Profile + PFP saved ✓"); await updateCommandCenter();
      }, true);
      $("#photo")?.addEventListener("change", () => { const file = $("#photo").files?.[0]; if (file) toast(`${file.name} selected`); });
    }
  }

  async function init() {
    try {
      await initClients(); addStyles(); injectCommandCenter(); injectCommunity(); patchAuthAndProfile();
      setTimeout(async () => { const s = await db.auth.getSession(); session = s.data.session; await loadEnrollment(); await updateCommandCenter(); }, 700);
      db.auth.onAuthStateChange(async (_event, newSession) => { session = newSession; await loadEnrollment(); await updateCommandCenter(); });
    } catch (error) { console.info("RATHOD compatibility layer unavailable", error); }
  }

  window.rathodCompat = { refresh: updateCommandCenter, loadCommunity: loadCompatPosts };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(init, 350)); else setTimeout(init, 350);
})();
