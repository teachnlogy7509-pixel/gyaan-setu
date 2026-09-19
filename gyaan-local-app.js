(() => {
  'use strict';

  const URL = 'https://oicluhfdvaroqvhwfwyp.supabase.co';
  const KEY = 'sb_publishable_iXAoOGZ0YppBP0Y1kJf02Q_E323DzKA';
  const BATCH_NAMES = [
    'Yakeen NEET Hindi 2027',
    'Yakeen NEET Hindi 2025',
    'Yakeen NEET Hindi 2.0 2025',
    'Yakeen NEET Hindi 3.0 2025',
    'Yakeen NEET Hindi 3.0 2027',
    'Yakeen NEET Hindi 2.0 2027'
  ];

  let db = null;
  let session = null;
  let profile = null;
  let currentBatch = null;
  let ypt = null;
  let yptTicker = null;
  let liveTicker = null;
  let bound = false;

  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
  const fmt = sec => {
    sec = Math.max(0, Math.floor(Number(sec) || 0));
    return [Math.floor(sec/3600), Math.floor(sec%3600/60), sec%60]
      .map(x => String(x).padStart(2,'0')).join(':');
  };
  const emailOf = () => String(session?.user?.email || profile?.email || '').toLowerCase();

  async function getDb() {
    if (db) return db;
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    db = createClient(URL, KEY, {
      auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true }
    });
    const s = await db.auth.getSession();
    session = s.data?.session || null;
    db.auth.onAuthStateChange((_event, next) => {
      session = next || null;
      setTimeout(loadAll, 50);
    });
    return db;
  }

  async function loadProfile() {
    if (!session?.user) { profile = null; return null; }
    const r = await db.from('profiles')
      .select('id,name,display_name,email,pfp_url,avatar_url,xp,saka_score,level,role')
      .eq('id', session.user.id).maybeSingle();
    profile = r.data || null;
    return profile;
  }

  async function resolveBatch() {
    const r = await db.from('batches').select('id,name,slug,position').order('position');
    const rows = r.data || [];
    currentBatch = rows.find(x => x.name === 'Yakeen NEET Hindi 2027')?.id || rows[0]?.id || null;
    return rows;
  }

  function openView(view) {
    document.querySelectorAll('.view').forEach(x => x.classList.toggle('active', x.id === view));
    document.querySelectorAll('[data-view]').forEach(x => x.classList.toggle('active', x.dataset.view === view));
  }

  function bindNavigation() {
    document.querySelectorAll('[data-view]').forEach(btn => {
      if (btn.dataset.gyaanLocalNav) return;
      btn.dataset.gyaanLocalNav = '1';
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopImmediatePropagation();
        openView(btn.dataset.view);
        if (btn.dataset.view === 'community') renderCommunity();
        if (btn.dataset.view === 'rank') renderLeaderboard();
        if (btn.dataset.view === 'dashboard') renderDashboard();
        if (btn.dataset.view === 'ypt') renderLive();
      }, true);
    });
  }

  async function renderDashboard() {
    const pdfBox = $('pdfs');
    if (!pdfBox || !session?.user) return;

    const [m, p] = await Promise.all([
      db.from('rathod_materials')
        .select('id,title,file_name,file_url,category,description')
        .order('id',{ascending:false}).limit(200),
      db.from('study_pdfs')
        .select('id,title,subject_id,type,pages,file_url,is_published')
        .eq('is_published',true).limit(100)
    ]);

    const materials = (m.data || []).map(x => ({
      title:x.title || x.file_name || 'Material',
      meta:(x.category || 'Study Material') + (x.file_name ? ' · '+x.file_name : ''),
      url:x.file_url
    }));

    const localPdfs = (p.data || [])
      .filter(x => x.file_url)
      .map(x => ({
        title:x.title || 'PDF',
        meta:(x.type || 'PDF') + (x.pages ? ' · '+x.pages+' pages' : ''),
        url:x.file_url
      }));

    const all = [...materials, ...localPdfs];
    pdfBox.innerHTML = all.length ? all.map(x => `
      <div class="pdf" style="display:flex;align-items:center;justify-content:space-between;gap:10px">
        <div><b>${esc(x.title)}</b><small>${esc(x.meta)}</small></div>
        ${x.url ? '<a href="'+esc(x.url)+'" target="_blank" rel="noopener" class="btn" style="text-decoration:none">Open</a>' : ''}
      </div>`).join('') : '<div class="empty">No materials available.</div>';

    const snap = await db.from('rathod_member_snapshot')
      .select('name,email,pfp_url,xp,score,season_xp,level')
      .eq('email', emailOf()).maybeSingle();

    const score = $('score');
    if (score) score.textContent = Number(snap.data?.score ?? profile?.saka_score ?? 0).toLocaleString();

    const name = profile?.name || profile?.display_name || snap.data?.name || emailOf().split('@')[0] || 'Learner';
    const pwName = $('gsPwName');
    if (pwName) pwName.textContent = name;
    const pwXp = $('gsPwXp');
    if (pwXp) pwXp.textContent = Number(snap.data?.xp ?? profile?.xp ?? 0).toLocaleString();
    const avatar = $('gsPwAvatar');
    if (avatar) {
      const src = snap.data?.pfp_url || profile?.pfp_url || profile?.avatar_url;
      avatar.innerHTML = src
        ? '<img src="'+esc(src)+'" alt="">'
        : esc(name.slice(0,2).toUpperCase());
    }
  }

  async function renderLeaderboard() {
    const box = $('leaders');
    if (!box || !session?.user) return;
    const r = await db.from('rathod_member_snapshot')
      .select('name,email,pfp_url,xp,score,season_xp,level')
      .order('xp',{ascending:false})
      .order('score',{ascending:false})
      .limit(200);

    if (r.error) {
      box.innerHTML = '<div class="empty">'+esc(r.error.message)+'</div>';
      return;
    }

    const rows = r.data || [];
    box.innerHTML = `
      <div class="gs-rh-list">
        <div class="gs-rh-row" style="background:#f7f7fb;font-weight:900">
          <div>#</div><div></div><div>RATHOD HUB MEMBERS</div><div style="text-align:right">XP</div><div style="text-align:right">SCORE</div>
        </div>
        ${rows.map((x,i) => `
          <div class="gs-rh-row">
            <div class="gs-rh-rank">#${i+1}</div>
            <div class="gs-rh-avatar">${x.pfp_url ? '<img src="'+esc(x.pfp_url)+'" alt="">' : esc((x.name||'GS').slice(0,2).toUpperCase())}</div>
            <div class="gs-rh-name">
              <b>${esc(x.name || 'Learner')}</b>
              <small>Level ${esc(x.level||1)} · Season XP ${Number(x.season_xp||0).toLocaleString()}</small>
            </div>
            <div class="gs-rh-val">${Number(x.xp||0).toLocaleString()}</div>
            <div class="gs-rh-val">${Number(x.score||0).toLocaleString()}</div>
          </div>`).join('')}
      </div>`;
  }

  async function renderCommunity() {
    const postsBox = $('posts');
    if (!postsBox || !session?.user || !currentBatch) return;

    const section = await db.from('sections')
      .select('id,type,name').eq('batch_id',currentBatch).eq('type','community').maybeSingle();

    const localPosts = section.data
      ? await db.from('posts').select('id,user_id,author_name,content,created_at')
          .eq('section_id',section.data.id).order('created_at',{ascending:false}).limit(100)
      : { data:[] };

    const legacy = await db.from('community_posts')
      .select('author_name,initials,role,content,likes,comments,created_at')
      .order('created_at',{ascending:false}).limit(20);

    const a = (localPosts.data || []).map(x => ({
      author_name:x.author_name, content:x.content, created_at:x.created_at,
      role:'GyaanSetu'
    }));
    const b = (legacy.data || []).map(x => ({
      author_name:x.author_name, content:x.content, created_at:x.created_at, role:x.role
    }));

    const rows = [...a,...b].sort((x,y)=>new Date(y.created_at)-new Date(x.created_at));

    postsBox.innerHTML = rows.length ? rows.map(x => `
      <article class="post">
        <b>${esc(x.author_name || 'Learner')}</b>
        <small>${esc(x.role || 'GyaanSetu')} · ${new Date(x.created_at).toLocaleString()}</small>
        <p>${esc(x.content || '')}</p>
      </article>`).join('') : '<div class="empty">Community अभी खाली है.</div>';
  }

  async function renderLive() {
    const box = $('liveGrid');
    if (!box || !session?.user) return;

    const cutoff = new Date(Date.now()-45000).toISOString();
    const r = await db.from('gyaan_ypt_sessions')
      .select('id,user_id,display_name,email,pfp_url,subject,camera_enabled,elapsed_seconds,last_heartbeat_at')
      .eq('status','live').gte('last_heartbeat_at',cutoff)
      .order('started_at',{ascending:true});

    const v = await db.from('gyaan_vip_members')
      .select('email,active,expires_at');

    const vip = new Set((v.data||[])
      .filter(x => x.active && (!x.expires_at || new Date(x.expires_at)>new Date()))
      .map(x => String(x.email||'').toLowerCase()));

    const rows = r.data || [];
    box.className = 'gyaan-live-grid';
    box.innerHTML = rows.length ? rows.map(x => `
      <div class="gyaan-live-card">
        <div class="gyaan-live-head">
          <div class="gyaan-live-avatar">${x.pfp_url ? '<img src="'+esc(x.pfp_url)+'" alt="">' : esc((x.display_name||'GS').slice(0,2).toUpperCase())}</div>
          <div style="min-width:0">
            <div class="gyaan-live-name">
              ${esc(x.display_name || 'Learner')}
              ${vip.has(String(x.email||'').toLowerCase()) ? '<span class="gyaan-ypt-vip">VIP</span>' : ''}
            </div>
            <div class="gyaan-live-sub">${esc(x.subject||'Study')} · ${x.camera_enabled?'CAMERA ON':'CAMERA OFF'} · ${fmt(x.elapsed_seconds)}</div>
          </div>
        </div>
      </div>`).join('') : '<div class="empty" style="grid-column:1/-1">No GyaanSetu learner live right now.</div>';

    $('liveCount').textContent = rows.length;
    $('liveTotal').textContent = rows.length;
    $('hero').textContent = rows.length
      ? rows.length+' GyaanSetu learner'+(rows.length>1?'s are':' is')+' live now.'
      : 'No live learners yet — start the first real session.';
  }

  async function saveYptEnd() {
    if (!ypt?.sessionId) return;
    const elapsed = Math.floor((Date.now()-ypt.startedAt)/1000);
    await db.from('gyaan_ypt_sessions')
      .update({status:'ended',ended_at:new Date().toISOString(),last_heartbeat_at:new Date().toISOString(),elapsed_seconds:elapsed})
      .eq('id',ypt.sessionId).eq('user_id',session.user.id);
  }

  async function startLocalYpt() {
    if (ypt?.running) return;
    if (!session?.user) {
      $('gyaanSetuAuth')?.classList.add('show');
      $('auth')?.classList.add('show');
      return;
    }

    const camera = !!$('camera')?.checked;
    let stream = null;

    if (camera) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({video:true,audio:false});
        $('video').srcObject = stream;
        $('video').style.display = 'block';
        $('placeholder').style.display = 'none';
      } catch (e) {
        if (typeof toast === 'function') toast('Camera permission नहीं मिली. Camera OFF करके Start करें.');
        return;
      }
    } else {
      $('video').srcObject = null;
      $('video').style.display = 'none';
      $('placeholder').style.display = '';
    }

    const subject = $('subject')?.selectedOptions?.[0]?.textContent || 'General Study';
    const display = profile?.name || profile?.display_name || session.user.email?.split('@')[0] || 'Learner';

    ypt = {
      running:true,
      startedAt:Date.now(),
      sessionId:null,
      stream,
      camera,
      subject
    };

    const ins = await db.from('gyaan_ypt_sessions').insert({
      user_id:session.user.id,
      display_name:display,
      email:session.user.email,
      pfp_url:profile?.pfp_url || profile?.avatar_url || null,
      subject,
      camera_enabled:camera,
      status:'live',
      started_at:new Date().toISOString(),
      last_heartbeat_at:new Date().toISOString(),
      elapsed_seconds:0
    }).select('id').single();

    if (!ins.error) ypt.sessionId = ins.data.id;

    $('start').disabled = true;
    $('stop').disabled = false;
    $('state').textContent = 'Live — GyaanSetu YPT';
    $('state').classList.add('gyaan-ypt-live');

    yptTicker = setInterval(async () => {
      if (!ypt?.running) return;
      const elapsed = Math.floor((Date.now()-ypt.startedAt)/1000);
      $('timer').textContent = fmt(elapsed);
      if (ypt.sessionId) {
        await db.from('gyaan_ypt_sessions')
          .update({elapsed_seconds:elapsed,last_heartbeat_at:new Date().toISOString()})
          .eq('id',ypt.sessionId).eq('user_id',session.user.id);
      }
    }, 1000);

    renderLive();
  }

  async function stopLocalYpt() {
    if (!ypt?.running) return;
    clearInterval(yptTicker);
    const seconds = Math.floor((Date.now()-ypt.startedAt)/1000);
    await saveYptEnd();
    ypt.stream?.getTracks().forEach(t => t.stop());
    $('video').srcObject = null;
    $('video').style.display = 'none';
    $('placeholder').style.display = '';
    $('timer').textContent = '00:00:00';
    $('state').textContent = 'No active session';
    $('state').classList.remove('gyaan-ypt-live');
    $('start').disabled = false;
    $('stop').disabled = true;
    ypt = null;
    renderLive();
    if (typeof toast === 'function') toast(seconds >= 60 ? 'YPT session saved ✓' : 'YPT session ended');
  }

  function bindYpt() {
    const start = $('start'), stop = $('stop');
    if (!start || !stop || start.dataset.gyaanLocalYpt) return;
    start.dataset.gyaanLocalYpt = '1';
    stop.dataset.gyaanLocalYpt = '1';
    start.addEventListener('click', e => {
      e.preventDefault();
      e.stopImmediatePropagation();
      startLocalYpt();
    }, true);
    stop.addEventListener('click', e => {
      e.preventDefault();
      e.stopImmediatePropagation();
      stopLocalYpt();
    }, true);
  }

  async function bindPost() {
    const btn = $('post'), input = $('postText');
    if (!btn || btn.dataset.gyaanLocalPost) return;
    btn.dataset.gyaanLocalPost = '1';
    btn.addEventListener('click', async e => {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (!session?.user || !currentBatch) return;
      const text = input.value.trim();
      if (!text) return;
      const s = await db.from('sections').select('id')
        .eq('batch_id',currentBatch).eq('type','community').maybeSingle();
      if (!s.data) return alert('Community section unavailable for this batch.');
      const r = await db.from('posts').insert({
        section_id:s.data.id,
        user_id:session.user.id,
        author_name:profile?.name || profile?.display_name || session.user.email?.split('@')[0] || 'Learner',
        initials:'GS',
        content:text
      });
      if (r.error) return alert(r.error.message);
      input.value = '';
      renderCommunity();
    }, true);
  }

  async function loadAll() {
    try {
      await getDb();
      const s = (await db.auth.getSession()).data?.session || null;
      session = s;
      if (!session?.user) {
        bindNavigation();
        bindYpt();
        return;
      }

      await Promise.all([loadProfile(), resolveBatch()]);
      bindNavigation();
      bindYpt();
      bindPost();
      await renderDashboard();
      await renderLeaderboard();
      await renderCommunity();
      await renderLive();

      if (!liveTicker) {
        liveTicker = setInterval(() => {
          if (document.visibilityState === 'visible') renderLive();
        }, 10000);
      }
    } catch (e) {
      console.warn('GyaanSetu local app:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(loadAll,150), {once:true});
  } else {
    setTimeout(loadAll,150);
  }

  window.gyaanSetuLocalApp = { refresh:loadAll, startYpt:startLocalYpt, stopYpt:stopLocalYpt };
})();