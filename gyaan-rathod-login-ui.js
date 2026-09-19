(() => {
  'use strict';
  const URL='https://oicluhfdvaroqvhwfwyp.supabase.co';
  const KEY='sb_publishable_iXAoOGZ0YppBP0Y1kJf02Q_E323DzKA';
  let db=null,mode='login';
  const $=id=>document.getElementById(id);
  async function getDb(){
    if(db) return db;
    const m=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    db=m.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    return db;
  }
  function status(msg,ok){const x=$('gsAuthStatus');if(!x)return;x.textContent=msg||'';x.style.color=ok?'#65d39a':'#ffb4b4';}
  function setMode(next){
    mode=next;
    $('gsLoginTab').classList.toggle('active',next==='login');
    $('gsSignupTab').classList.toggle('active',next==='signup');
    $('gsNameWrap').style.display=next==='signup'?'block':'none';
    $('gsSubmit').textContent=next==='signup'?'Create Account':'Login';
    $('gsPassword').autocomplete=next==='signup'?'new-password':'current-password';
    status('');
  }
  async function submit(){
    const email=$('gsEmail').value.trim().toLowerCase(), password=$('gsPassword').value, name=$('gsName').value.trim()||email.split('@')[0]||'Learner';
    if(!/^\S+@\S+\.\S+$/.test(email)) return status('Valid email address डालें.');
    if(password.length<6) return status('Password कम से कम 6 characters का होना चाहिए.');
    const b=$('gsSubmit');b.disabled=true;b.textContent=mode==='signup'?'Creating…':'Signing in…';
    try{
      const c=await getDb();
      if(mode==='signup'){
        const res=await fetch(URL+'/functions/v1/gyaan-signup',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({email,password,name})});
        const data=await res.json().catch(()=>({}));
        if(!res.ok) throw new Error(data.error||'Account creation failed');
      }
      let login=await c.auth.signInWithPassword({email,password});
      if(!login.error&&login.data?.session){
        status('Login successful ✓',true);
        window.dispatchEvent(new CustomEvent('gyaan-auth-success',{detail:{session:login.data.session,user:login.data.user}}));
        $('gyaanSetuAuth').classList.remove('show');
        setTimeout(()=>location.reload(),250);
        return;
      }

      // Migrated RATHOD members have a local snapshot but may not yet have
      // a GyaanSetu Auth user. Provision their local account with the password
      // they entered, then sign in. No RATHOD runtime connection is used.
      if(mode==='login'){
        const snap=await c.from('rathod_member_snapshot')
          .select('name,email')
          .eq('email',email)
          .maybeSingle();

        if(snap.data?.email){
          status('Migrated member मिला — GyaanSetu account तैयार हो रहा है…');
          const res=await fetch(URL+'/functions/v1/gyaan-signup',{
            method:'POST',
            headers:{apikey:KEY,'Content-Type':'application/json'},
            body:JSON.stringify({email,password,name:snap.data.name||name})
          });
          const data=await res.json().catch(()=>({}));
          if(!res.ok&&!/already exists/i.test(String(data.error||''))){
            throw new Error(data.error||'GyaanSetu account provision failed');
          }
          login=await c.auth.signInWithPassword({email,password});
          if(login.error||!login.data?.session){
            throw new Error(login.error?.message||'GyaanSetu account बना, लेकिन session नहीं बना.');
          }
          status('GyaanSetu login successful ✓',true);
          window.dispatchEvent(new CustomEvent('gyaan-auth-success',{detail:{session:login.data.session,user:login.data.user}}));
          $('gyaanSetuAuth').classList.remove('show');
          setTimeout(()=>location.reload(),250);
          return;
        }
      }

      const msg=login.error?.message||'Login failed';
      status(msg);
    }
    finally{b.disabled=false;b.textContent=mode==='signup'?'Create Account':'Login';}
  }
  async function sendOtp(){
    const email=$('gsEmail').value.trim().toLowerCase();
    if(!/^\S+@\S+\.\S+$/.test(email)) return status('पहले email डालें.');
    try{const c=await getDb();const r=await c.auth.signInWithOtp({email,options:{shouldCreateUser:true,emailRedirectTo:location.href}});status(r.error?.message||'Email login link भेज दिया गया ✓',!r.error);}
    catch(e){status(e?.message||'OTP login failed');}
  }
  function build(){
    if($('gyaanSetuAuth')) return;
    const style=document.createElement('style');style.textContent=
      '#gyaanSetuAuth{position:fixed;inset:0;display:none;place-items:center;background:rgba(0,0,0,.74);backdrop-filter:blur(9px);z-index:9999;padding:16px}' +
      '#gyaanSetuAuth.show{display:grid}' +
      '#gyaanSetuAuth .card{width:min(430px,100%);padding:21px;border-radius:22px;background:linear-gradient(145deg,#0b0f14,#171a22);border:1px solid rgba(255,255,255,.13);box-shadow:0 24px 70px rgba(0,0,0,.5);color:#fff;position:relative}' +
      '#gyaanSetuAuth .logo{width:66px;height:66px;border-radius:18px;margin:0 auto 10px;display:grid;place-items:center;background:linear-gradient(135deg,#effff8,#ddf7ee);border:1px solid rgba(37,139,104,.45);color:#258b68;font-size:25px;font-weight:950}' +
      '#gyaanSetuAuth h1{text-align:center;font-size:24px;font-weight:950;margin:0}' +
      '#gyaanSetuAuth .sub{text-align:center;color:rgba(255,255,255,.66);font-size:11px;margin:5px 0 0}' +
      '#gyaanSetuAuth .tabs{display:grid;grid-template-columns:1fr 1fr;gap:8px;background:rgba(255,255,255,.06);padding:6px;border-radius:999px;margin:16px 0 12px}' +
      '#gyaanSetuAuth .tabs button{border:0;border-radius:999px;padding:10px;background:transparent;color:#c9d0d5;font-weight:900;font-size:12px}' +
      '#gyaanSetuAuth .tabs button.active{background:#258b68;color:#fff}' +
      '#gyaanSetuAuth .field{margin-top:10px}' +
      '#gyaanSetuAuth .field label{display:block;font-size:10px;color:#cbd5db;font-weight:800;margin-bottom:6px;text-transform:uppercase;letter-spacing:.07em}' +
      '#gyaanSetuAuth .input{width:100%;box-sizing:border-box;border-radius:14px;border:1px solid rgba(255,255,255,.14);background:#0b0e13;color:#fff;padding:13px 14px;font-size:14px;outline:none}' +
      '#gyaanSetuAuth .primary,#gyaanSetuAuth .secondary,#gyaanSetuAuth .forgot{width:100%;border-radius:14px;padding:12px 14px;font-weight:900;cursor:pointer}' +
      '#gyaanSetuAuth .primary{border:0;background:#258b68;color:#fff;margin-top:15px}.secondary{border:1px solid rgba(255,255,255,.13);background:#22272f;color:#fff;margin-top:9px;font-size:12px}.forgot{border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.05);color:#fff;margin-top:9px;font-size:12px}' +
      '#gyaanSetuAuth .reset{display:none;margin-top:10px;padding:11px;border-radius:12px;background:#0b0e13;border:1px solid rgba(255,255,255,.10)}' +
      '#gyaanSetuAuth .close{position:absolute;right:12px;top:12px;width:38px;height:38px;border-radius:14px;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.25);color:#fff;font-size:18px}' +
      '#gyaanSetuAuth small{display:block;min-height:28px;text-align:center;margin-top:10px;font-size:10px;line-height:1.4}';
    document.head.appendChild(style);
    const wrap=document.createElement('div');wrap.id='gyaanSetuAuth';
    wrap.innerHTML='<div class="card"><button class="close" id="gsAuthClose" type="button">×</button><div class="logo">GS</div><h1>GYAANSETU</h1><div class="sub">Learn Together · NEET Prep & Live Battles</div><div class="tabs"><button id="gsLoginTab" type="button" class="active">Login</button><button id="gsSignupTab" type="button">Create Account</button></div><div id="gsNameWrap" class="field" style="display:none"><label>Full Name</label><input id="gsName" class="input" autocomplete="name" placeholder="Your Name"></div><div class="field"><label>Email Address</label><input id="gsEmail" class="input" type="email" autocomplete="email" placeholder="you@example.com"></div><div class="field"><label>Password</label><input id="gsPassword" class="input" type="password" autocomplete="current-password" minlength="6" placeholder="Minimum 6 characters"></div><button id="gsSubmit" class="primary" type="button">Login</button><button id="gsOtpLogin" class="secondary" type="button">Email OTP Login</button><button id="gsForgot" class="forgot" type="button">Forgot password · Send reset email</button><div id="gsReset" class="reset"><input id="gsResetEmail" class="input" type="email" placeholder="Registered email"><button id="gsResetSend" class="secondary" type="button">Send reset email</button></div><small id="gsAuthStatus"></small></div>';
    document.body.appendChild(wrap);
    const open=()=>{wrap.classList.add('show');setMode('login');};const close=()=>wrap.classList.remove('show');
    const account=$('accountBtn');
    if(account&&!account.dataset.gsAuthBound){account.dataset.gsAuthBound='1';account.addEventListener('click',async e=>{e.preventDefault();e.stopImmediatePropagation();const c=await getDb();const s=(await c.auth.getSession()).data?.session;if(s&&typeof window.openProfile==='function'){try{await window.openProfile();return;}catch(_){}}open();},true);}
    $('gsLoginTab').onclick=()=>setMode('login');$('gsSignupTab').onclick=()=>setMode('signup');$('gsSubmit').onclick=e=>{e.preventDefault();submit();};$('gsOtpLogin').onclick=sendOtp;
    ['gsEmail','gsPassword','gsName'].forEach(id=>$(id).addEventListener('keydown',e=>{if(e.key==='Enter')submit();}));
    $('gsAuthClose').onclick=close;wrap.addEventListener('click',e=>{if(e.target===wrap)close();});
    $('gsForgot').onclick=()=>{const x=$('gsReset');x.style.display=x.style.display==='block'?'none':'block';$('gsResetEmail').value=$('gsEmail').value.trim().toLowerCase();};
    $('gsResetSend').onclick=async()=>{const email=$('gsResetEmail').value.trim().toLowerCase();if(!email)return status('Registered email डालें.');const c=await getDb();const r=await c.auth.resetPasswordForEmail(email,{redirectTo:location.href});status(r.error?.message||'Reset email sent ✓',!r.error);};
    const old=$('auth');if(old){new MutationObserver(()=>{if(old.classList.contains('show')||old.style.display==='flex'){old.classList.remove('show');old.style.display='none';open();}}).observe(old,{attributes:true,attributeFilter:['class','style']});}
    setMode('login');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build,{once:true});else build();
})();