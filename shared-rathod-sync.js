/* Shared RATHOD-HUB ↔ GyaanSetu UI (live sync to RATHOD). */
(() => {
  'use strict';
  if (window.__RATHOD_SHARED_UI__) return;
  window.__RATHOD_SHARED_UI__ = true;

  const URL = 'https://oicluhfdvaroqvhwfwyp.supabase.co';
  const KEY = 'sb_publishable_iXAoOGZ0YppBP0Y1kJf02Q_E323DzKA';
  const esc = (value) => String(value ?? '').replace(/[&<>\"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[ch]));
  let db = null;
  let timer = null;

  const style = document.createElement('style');
  style.textContent = `
    #rhSharedCard{margin:24px 0;padding:18px;border:1px solid #dce6e7;border-radius:12px;background:linear-gradient(120deg,#fff7eb,#f4f1ff)}
    #rhSharedCard h2{margin:0 0 5px;font-size:20px}#rhSharedCard p{margin:4px 0;color:#68777b;font-size:11px}
    #rhSharedStats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0}.rhStat{padding:10px;border-radius:9px;background:#fff;border:1px solid #e6edef}.rhStat b{display:block;font-size:18px;color:#ed9858}.rhStat small{color:#68777b;font-size:9px}
    #rhSharedTools{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}#rhSharedTools input{flex:1;min-width:180px;border:1px solid #dce6e7;border-radius:7px;padding:9px;font-size:11px}#rhSharedTools button{border:0;border-radius:7px;background:#5c50d6;color:#fff;padding:9px 12px;font-size:11px;font-weight:800}
    #rhSharedStatus{font-size:10px;color:#258b68;margin-top:8px}#rhSharedBoard{margin-top:16px}.rhSharedRow{display:flex;justify-content:space-between;gap:10px;padding:9px 3px;border-bottom:1px solid #dce6e7;font-size:11px}.rhSharedRow small{display:block;color:#68777b;font-size:9px}.rhSharedRow b{color:#5c50d6}
    @media(max-width:800px){#rhSharedStats{grid-template-columns:repeat(2,1fr)}}
  `;
  document.head.appendChild(style);

  const card = document.createElement('section');
  card.id = 'rhSharedCard';
  card.innerHTML = `
    <div class="row"><div><small>RATHOD HUB ↔ GYAANSETU</small><h2>एक live synced progress space</h2><p>YPT study time → RATHOD HUB XP/Score में live sync होता है।</p></div><button class="btn" id="rhRefreshShared">Refresh</button></div>
    <div id="rhSharedStats"><div class="rhStat"><b id="rhXp">—</b><small>RATHOD Total XP</small></div><div class="rhStat"><b id="rhSeasonXp">—</b><small>RATHOD Season XP</small></div><div class="rhStat"><b id="rhSaka">—</b><small>Saka Score</small></div></div>
    <div id="rhSharedTools"><input id="rhCouponInput" placeholder="RATHOD coupon code"><button id="rhRedeemCoupon">Redeem coupon</button><button id="rhLoadBoard">RATHOD leaderboard</button></div>
    <div id="rhSharedStatus">Login करके synced progress देखें।</div><div id="rhSharedBoard" hidden></div>`;

  function status(message, error = false) {
    const node = document.querySelector('#rhSharedStatus');
    if (node) { node.textContent = message; node.style.color = error ? '#b45309' : '#258b68'; }
  }

  function putCard() {
    if (document.querySelector('#rhSharedCard')) return;
    const dashboard = document.querySelector('#dashboard');
    if (!dashboard) return;
    const anchor = dashboard.querySelector('.cols') || dashboard.querySelector('.hero');
    if (anchor) anchor.parentNode.insertBefore(card, anchor);
    else dashboard.appendChild(card);
  }

  function row(item) {
    return `<div class="rhSharedRow"><span><b>#${item.rank}</b> ${esc(item.display_name)}<small>Level ${item.league_level} · Season XP ${item.season_xp}</small></span><b>${item.xp} XP</b></div>`;
  }

  async function bridge(action, extra = {}) {
    if (!db) return { error: { message: 'Sync client unavailable' } };
    const session = await db.auth.getSession();
    const s = session.data?.session;
    if (!s?.user) return { error: { message: 'Login required' } };

    const response = await fetch(`${URL}/functions/v1/gyaan-rathod-sync`, {
      method: 'POST',
      headers: { apikey: KEY, Authorization: `Bearer ${s.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra })
    });
    const result = await response.json().catch(() => ({}));
    return response.ok ? { data: result } : { error: { message: result.error || 'Sync failed' } };
  }

  async function loadProgress() {
    putCard();
    const result = await bridge('sync_progress');
    if (result.error) { status(result.error.message, true); return; }
    const data = result.data || {};
    document.querySelector('#rhXp').textContent = data.xp ?? 0;
    document.querySelector('#rhSeasonXp').textContent = data.season_xp ?? data.score ?? 0;
    document.querySelector('#rhSaka').textContent = data.saka_score ?? 0;
    status(`Synced with RATHOD HUB · Level ${data.league_level || 1}.`);
  }

  async function loadBoard() {
    const board = document.querySelector('#rhSharedBoard');
    if (!board) return;
    board.hidden = false;
    board.innerHTML = '<div class="empty">RATHOD leaderboard loading…</div>';

    const result = await bridge('leaderboard');
    if (result.error) { board.innerHTML = ''; status(result.error.message, true); return; }

    const rows = result.data?.rows || [];
    board.innerHTML = `<div class="muted" style="margin:10px 0 4px">RATHOD HUB leaderboard (live)</div>${rows.map(row).join('') || '<div class="empty">No RATHOD scores yet.</div>'}`;
    status('RATHOD leaderboard updated.');
  }

  async function redeem() {
    const input = document.querySelector('#rhCouponInput');
    const code = input?.value.trim();
    if (!code) { status('Coupon code लिखें।', true); return; }

    const result = await bridge('redeem_coupon', { code });
    if (result.error) { status(result.error.message, true); return; }
    if (!result.data?.success) { status(result.data?.error || 'Coupon invalid or expired.', true); return; }

    status(`RATHOD VIP active until ${new Date(result.data.expires_at).toLocaleDateString()}.`);
    input.value = '';
  }

  async function start() {
    putCard();
    const mod = await import('https://esm.sh/@supabase/supabase-js@2');
    db = mod.createClient(URL, KEY);

    document.querySelector('#rhRefreshShared')?.addEventListener('click', loadProgress);
    document.querySelector('#rhLoadBoard')?.addEventListener('click', loadBoard);
    document.querySelector('#rhRedeemCoupon')?.addEventListener('click', redeem);

    await loadProgress();
    timer = window.setInterval(loadProgress, 30000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
