(() => {
  'use strict';

  const URL = 'https://oicluhfdvaroqvhwfwyp.supabase.co';
  const KEY = 'sb_publishable_iXAoOGZ0YppBP0Y1kJf02Q_E323DzKA';
  const $ = (id) => document.getElementById(id);
  let client = null;
  let mode = 'login';

  function ensureClient() {
    if (client) return client;
    return import('https://esm.sh/@supabase/supabase-js@2').then(({ createClient }) => {
      client = createClient(URL, KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      return client;
    });
  }

  function setStatus(message, ok = false) {
    const node = $('gsAuthStatus');
    if (!node) return;
    node.textContent = message || '';
    node.style.color = ok ? '#65d39a' : 'rgba(255,255,255,.78)';
  }

  function build() {
    if ($('gyaanRathodAuth')) return;
    const style = document.createElement('style');
    style.textContent = `
      #gyaanRathodAuth{position:fixed;inset:0;display:none;place-items:center;background:rgba(0,0,0,.72);backdrop-filter:blur(10px);z-index:9999;padding:16px}
      #gyaanRathodAuth.show{display:grid}
      #gyaanRathodAuth .gs-auth-card{width:min(430px,100%);border-radius:22px;padding:20px;background:linear-gradient(145deg,#0b0f14,#171a22);border:1px solid rgba(255,255,255,.14);box-shadow:0 24px 70px rgba(0,0,0,.5);color:#fff;position:relative}
      #gyaanRathodAuth .gs-auth-logo{width:66px;height:66px;border-radius:18px;background:rgba(239,43,43,.10);border:1px solid rgba(239,43,43,.55);display:grid;place-items:center;margin:0 auto 10px;color:#ff6d6d;font-size:25px;font-weight:900}
      #gyaanRathodAuth .gs-auth-title{text-align:center;font-size:24px;font-weight:900;margin:0}
      #gyaanRathodAuth .gs-auth-sub{text-align:center;color:rgba(255,255,255,.65);font-size:11px;margin:4px 0 0}
      #gyaanRathodAuth .gs-auth-tabs{display:grid;grid-template-columns:1fr 1fr;gap:8px;background:rgba(255,255,255,.06);padding:6px;border-radius:999px;margin:16px 0 12px}
      #gyaanRathodAuth .gs-auth-tabs button{border:0;border-radius:999px;padding:10px 12px;background:transparent;color:rgba(255,255,255,.7);font-weight:900;font-size:12px;cursor:pointer}
      #gyaanRathodAuth .gs-auth-tabs button.active{background:linear-gradient(90deg,#ef2b2b,#ff3b30);color:#fff}
      #gyaanRathodAuth .gs-field{margin-top:10px}
      #gyaanRathodAuth .gs-field label{display:block;font-size:10px;color:rgba(255,255,255,.7);font-weight:800;margin-bottom:6px;letter-spacing:.07em;text-transform:uppercase}
      #gyaanRathodAuth .gs-input{width:100%;box-sizing:border-box;border-radius:14px;border:1px solid rgba(255,255,255,.14);background:#0b0e13;color:#fff;padding:13px 14px;font-size:14px;outline:none}
      #gyaanRathodAuth .gs-primary,#gyaanRathodAuth .gs-secondary{width:100%;border-radius:14px;padding:12px 14px;margin-top:14px;font-weight:900;font-size:14px;cursor:pointer}
      #gyaanRathodAuth .gs-primary{border:0;background:linear-gradient(90deg,#ef2b2b,#ff3b30);color:#fff}
      #gyaanRathodAuth .gs-secondary{border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.07);color:#fff;font-size:12px}
      #gyaanRathodAuth .gs-forgot{width:100%;border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:11px 14px;margin-top:10px;background:rgba(255,255,255,.05);color:#fff;font-weight:900;font-size:12px;cursor:pointer}
      #gyaanRathodAuth .gs-close{position:absolute;right:12px;top:12px;width:38px;height:38px;border-radius:14px;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.25);color:#fff;font-size:18px;cursor:pointer}
      #gyaanRathodAuth .gs-reset{display:none;margin-top:10px;padding:11px;border-radius:12px;background:#0b0e13;border:1px solid rgba(255,255,255,.10)}
      #gyaanRathodAuth small{display:block;text-align:center;min-height:18px;margin-top:9px;font-size:10px}
    `;
    document.head.appendChild(style);

    const backdrop = document.createElement('div');
    backdrop.id = 'gyaanRathodAuth';
    backdrop.innerHTML = `
      <div class="gs-auth-card" role="dialog" aria-modal="true">
        <button class="gs-close" id="gsAuthClose" type="button">×</button>
        <div class="gs-auth-logo" aria-label="GyaanSetu logo">GS</div>
        <h1 class="gs-auth-title">GYAANSETU</h1>
        <p class="gs-auth-sub">Doctor's Dream · NEET Prep & Live Battles</p>
        <div class="gs-auth-tabs">
          <button id="gsAuthLoginTab" type="button" class="active">Login</button>
          <button id="gsAuthSignupTab" type="button">Create Account</button>
        </div>
        <div id="gsNameWrap" class="gs-field" style="display:none">
          <label>Full Name</label>
          <input id="gsAuthName" class="gs-input" autocomplete="name" placeholder="Your Name">
        </div>
        <div class="gs-field">
          <label>Email Address</label>
          <input id="gsAuthEmail" class="gs-input" type="email" autocomplete="email" required placeholder="you@example.com">
        </div>
        <div class="gs-field">
          <label>Password</label>
          <input id="gsAuthPassword" class="gs-input" type="password" autocomplete="current-password" minlength="6" required placeholder="Minimum 6 characters">
        </div>
        <button id="gsAuthSubmit" class="gs-primary" type="button">Login</button>
        <button id="gsForgot" class="gs-forgot" type="button">Forgot password · Send reset email</button>
        <div id="gsResetBox" class="gs-reset">
          <input id="gsResetEmail" class="gs-input" type="email" placeholder="Registered email">
          <button id="gsResetSend" class="gs-secondary" type="button">Send reset email</button>
        </div>
        <small id="gsAuthStatus"></small>
      </div>`;
    document.body.appendChild(backdrop);

    const open = () => backdrop.classList.add('show');
    const close = () => backdrop.classList.remove('show');

    const account = $('accountBtn');
    if (account && !account.dataset.gsAuthBound) {
      account.dataset.gsAuthBound = '1';
      account.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        const c = await ensureClient();
        const current = (await c.auth.getSession()).data?.session;
        if (current) {
          const profileBtn = document.querySelector('#profileClose') ? null : null;
          if (typeof window.openProfile === 'function') { try { await window.openProfile(); return; } catch (_) {} }
        }
        open();
      }, true);
    }

    function setMode(next) {
      mode = next;
      $('gsAuthLoginTab').classList.toggle('active', next === 'login');
      $('gsAuthSignupTab').classList.toggle('active', next === 'signup');
      $('gsNameWrap').style.display = next === 'signup' ? 'block' : 'none';
      $('gsAuthSubmit').textContent = next === 'signup' ? 'Create Account' : 'Login';
      $('gsAuthPassword').autocomplete = next === 'signup' ? 'new-password' : 'current-password';
      setStatus('');
    }

    async function submit() {
      const email = $('gsAuthEmail').value.trim().toLowerCase();
      const password = $('gsAuthPassword').value;
      const name = $('gsAuthName').value.trim() || email.split('@')[0] || 'Learner';
      if (!email || password.length < 6) return setStatus('Valid email and 6+ character password required.');
      const button = $('gsAuthSubmit');
      button.disabled = true;
      button.textContent = mode === 'signup' ? 'Creating…' : 'Signing in…';
      try {
        const c = await ensureClient();
        if (mode === 'signup') {
          const response = await fetch(`${URL}/functions/v1/gyaan-signup`, {
            method: 'POST',
            headers: { apikey: KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name })
          });
          const result = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(result.error || 'Account creation failed');
        }
        const result = await c.auth.signInWithPassword({ email, password });
        if (result.error) throw result.error;
        const confirmed = result.data?.session || (await c.auth.getSession()).data?.session;
        if (!confirmed) throw new Error('Login succeeded but session was not created. Please try again.');
        window.dispatchEvent(new CustomEvent('gyaan-auth-success', { detail: { session: confirmed, user: confirmed.user } }));
        setStatus(mode === 'signup' ? 'Account created ✓' : 'Login successful ✓', true);
        close();
        setTimeout(() => window.location.reload(), 250);
      } catch (error) {
        setStatus(error?.message || 'Authentication failed');
      } finally {
        button.disabled = false;
        button.textContent = mode === 'signup' ? 'Create Account' : 'Login';
      }
    }

    $('gsAuthLoginTab').addEventListener('click', () => setMode('login'));
    $('gsAuthSignupTab').addEventListener('click', () => setMode('signup'));
    $('gsAuthSubmit').addEventListener('click', (e) => { e.preventDefault(); submit(); });
    ['gsAuthEmail','gsAuthPassword','gsAuthName'].forEach(id => $(id)?.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); }));
    $('gsAuthClose').addEventListener('click', close);
    backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
    $('gsForgot').addEventListener('click', () => {
      const box = $('gsResetBox');
      box.style.display = box.style.display === 'block' ? 'none' : 'block';
      $('gsResetEmail').value = $('gsAuthEmail').value.trim().toLowerCase();
    });
    $('gsResetSend').addEventListener('click', async () => {
      const email = $('gsResetEmail').value.trim().toLowerCase();
      if (!email) return setStatus('Registered email डालें.');
      const c = await ensureClient();
      const result = await c.auth.resetPasswordForEmail(email, { redirectTo: location.href });
      setStatus(result.error?.message || 'Reset email sent ✓', !result.error);
    });

    // Also open the fixed overlay when old app code tries to open #auth.
    const oldAuth = $('auth');
    if (oldAuth) {
      const observer = new MutationObserver(() => {
        if (oldAuth.classList.contains('show') || oldAuth.style.display === 'flex') {
          oldAuth.classList.remove('show');
          oldAuth.style.display = 'none';
          open();
        }
      });
      observer.observe(oldAuth, { attributes: true, attributeFilter: ['class','style'] });
    }

    setMode('login');
    // Remove any stale create-mode values when the overlay is reopened.
    const openLogin = () => { setMode('login'); open(); };
    backdrop.openLogin = openLogin;
    return backdrop;
  }

  async function init() {
    try {
      await ensureClient();
      build();
    } catch (error) {
      console.error('GyaanSetu auth UI init failed:', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init(), { once: true });
  } else {
    init();
  }
})();