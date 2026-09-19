(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const ensureStyle = () => {
    if ($('#gyaanRathodLoginStyle')) return;
    const style = document.createElement('style');
    style.id = 'gyaanRathodLoginStyle';
    style.textContent = `
      .gyaan-auth-backdrop{position:fixed;inset:0;display:none;place-items:center;background:rgba(0,0,0,.72);backdrop-filter:blur(10px);z-index:9999;padding:16px}
      .gyaan-auth-backdrop.show{display:grid}
      .gyaan-auth-card{width:min(430px,100%);border-radius:22px;padding:20px;background:linear-gradient(145deg,#0b0f14,#171a22);border:1px solid rgba(255,255,255,.14);box-shadow:0 24px 70px rgba(0,0,0,.5);color:#fff;position:relative;overflow:hidden}
      .gyaan-auth-card:before{content:"";position:absolute;inset:-120px -80px auto auto;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle,rgba(239,43,43,.35),transparent 60%);filter:blur(2px);opacity:.9}
      .gyaan-auth-logo{width:66px;height:66px;border-radius:18px;background:rgba(239,43,43,.10);border:1px solid rgba(239,43,43,.55);display:grid;place-items:center;margin:0 auto 10px}
      .gyaan-auth-logo img{width:48px;height:48px}
      .gyaan-auth-title{font-size:24px;font-weight:900;letter-spacing:.02em;text-align:center;margin:0}
      .gyaan-auth-sub{margin:4px 0 0;text-align:center;color:rgba(255,255,255,.65);font-size:11px}
      .gyaan-auth-seg{display:grid;grid-template-columns:1fr 1fr;gap:8px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.10);padding:6px;border-radius:999px;margin:16px 0 12px}
      .gyaan-auth-seg button{border:0;border-radius:999px;padding:10px 12px;background:transparent;color:rgba(255,255,255,.7);font-weight:900;font-size:12px}
      .gyaan-auth-seg button.active{background:linear-gradient(90deg,#ef2b2b,#ff3b30);color:#fff;box-shadow:0 10px 30px rgba(239,43,43,.2)}
      .gyaan-field{margin-top:10px}
      .gyaan-field label{display:block;font-size:10px;color:rgba(255,255,255,.7);font-weight:800;margin-bottom:6px;letter-spacing:.07em;text-transform:uppercase}
      .gyaan-input{width:100%;border-radius:14px;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.35);color:#fff;padding:13px 14px;font-size:14px;outline:none}
      .gyaan-input::placeholder{color:rgba(255,255,255,.35)}
      .gyaan-primary{width:100%;border:0;border-radius:14px;padding:12px 14px;margin-top:14px;background:linear-gradient(90deg,#ef2b2b,#ff3b30);color:#fff;font-weight:900;font-size:14px}
      .gyaan-secondary{width:100%;border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:12px 14px;margin-top:10px;background:rgba(255,255,255,.07);color:#fff;font-weight:900;font-size:13px}
      .gyaan-forgot{width:100%;border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:11px 14px;margin-top:10px;background:rgba(255,255,255,.05);color:rgba(255,255,255,.85);font-weight:900;font-size:12px}
      .gyaan-auth-close{position:absolute;right:12px;top:12px;width:38px;height:38px;border-radius:14px;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.25);color:#fff;font-size:18px}
      .gyaan-auth-note{margin-top:10px;text-align:center;font-size:11px;color:rgba(255,255,255,.7)}
    `;
    document.head.appendChild(style);
  };

  const build = () => {
    ensureStyle();
    if ($('#gyaanRathodAuth')) return;
    const backdrop = document.createElement('div');
    backdrop.id = 'gyaanRathodAuth';
    backdrop.className = 'gyaan-auth-backdrop';
    backdrop.innerHTML = `
      <div class="gyaan-auth-card" role="dialog" aria-modal="true">
        <button class="gyaan-auth-close" type="button" id="gyaanAuthClose">×</button>
        <div class="gyaan-auth-logo"><img src="icon-192.png" alt="logo"></div>
        <h1 class="gyaan-auth-title">RATHOD HUB</h1>
        <p class="gyaan-auth-sub">Doctor's Dream · NEET Prep & Live Battles</p>
        <div class="gyaan-auth-seg">
          <button type="button" id="gyaanAuthTabLogin" class="active">Login</button>
          <button type="button" id="gyaanAuthTabSignup">Create Account</button>
        </div>
        <div id="gyaanNameWrap" style="display:none" class="gyaan-field">
          <label>Full Name</label>
          <input id="name" class="gyaan-input" placeholder="Your Name" />
        </div>
        <div class="gyaan-field">
          <label>Email Address</label>
          <input id="email" type="email" class="gyaan-input" placeholder="aspirant@neet.in" />
        </div>
        <div class="gyaan-field">
          <label>Password</label>
          <input id="password" type="password" class="gyaan-input" placeholder="Minimum 6 characters" />
        </div>
        <button class="gyaan-primary" id="gyaanDoLogin" type="button">Login</button>
        <button class="gyaan-secondary" id="signup" type="button" style="display:none">Create Account</button>
        <button class="gyaan-forgot" id="gyaanForgotToggle" type="button">Forgot password · Send OTP</button>
        <div id="authStatus" class="gyaan-auth-note"></div>
      </div>
    `;
    document.body.appendChild(backdrop);

    const open = () => backdrop.classList.add('show');
    const close = () => backdrop.classList.remove('show');

    // Replace old modal openers
    const account = $('#account');
    if (account) {
      account.addEventListener('click', (e) => {
        // if already logged in, let existing profile open
        const label = String(account.textContent || '').toLowerCase();
        if (label.includes('profile')) return;
        e.preventDefault();
        open();
      }, true);
    }

    $('#gyaanAuthClose')?.addEventListener('click', close);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });

    const setMode = (mode) => {
      const isSignup = mode === 'signup';
      $('#gyaanAuthTabLogin').classList.toggle('active', !isSignup);
      $('#gyaanAuthTabSignup').classList.toggle('active', isSignup);
      $('#gyaanNameWrap').style.display = isSignup ? 'block' : 'none';
      $('#gyaanDoLogin').style.display = isSignup ? 'none' : 'block';
      $('#signup').style.display = isSignup ? 'block' : 'none';
    };

    $('#gyaanAuthTabLogin')?.addEventListener('click', () => setMode('login'));
    $('#gyaanAuthTabSignup')?.addEventListener('click', () => setMode('signup'));

    // Trigger existing handlers
    $('#gyaanDoLogin')?.addEventListener('click', () => {
      const form = $('#authForm');
      if (form) form.requestSubmit();
      else close();
    });

    // Hide old modal
    const oldAuth = $('#auth');
    if (oldAuth) oldAuth.style.display = 'none';

    // keep forgot button: gyaan-auth-fix.js injects its own panel; just click its toggle
    $('#gyaanForgotToggle')?.addEventListener('click', (e) => {
      e.preventDefault();
      const btn = $('#gyaanForgotButton');
      if (btn) btn.click();
    });
  };

  const init = () => {
    build();
    // also open when existing code tries to show old modal
    const oldAuth = $('#auth');
    if (oldAuth) {
      const obs = new MutationObserver(() => {
        const open = oldAuth.classList.contains('show');
        if (open) {
          oldAuth.classList.remove('show');
          $('#gyaanRathodAuth')?.classList.add('show');
        }
      });
      obs.observe(oldAuth, { attributes: true, attributeFilter: ['class'] });
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(init, 50), { once: true });
  else setTimeout(init, 50);
})();
