/* =================================================================
   NautilusClaw shared auth — included by every page on the site.
   Supabase-backed parent accounts and saved learning activity.
   Server-side sign-in; provider configuration is retained from production.
   ================================================================= */
(function (global) {
  const LEGACY_KID = 'nautilusclaw-kids-demo';

  /* ---------- Supabase-backed accounts (cross-device, server-side) ----------
     Replaces the old localStorage + SHA-256 store. The synchronous API
     (currentUser / updateCurrentUser) is preserved via an in-memory cache that
     is hydrated from Supabase; writes are debounced back to the parent row. */
  const cfg = global.SUPABASE_CONFIG;
  const sb = (cfg && global.supabase && !String(cfg.url || '').includes('YOUR-PROJECT'))
    ? global.supabase.createClient(cfg.url, cfg.anonKey)
    : null;

  let _user = null;   // { email, parentName, kid, progress, concerns }
  let _uid = null;    // Supabase auth user id
  let _token = null;  // current access token (sent to the backend for auth)
  let _saveTimer = null;

  /* ---------- Event bus ---------- */
  const listeners = new Set();
  function on(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  function fire() { listeners.forEach(fn => { try { fn(_user); } catch {} }); }

  /* ---------- Hydrate the in-memory cache from a Supabase session ---------- */
  async function hydrate(session) {
    if (!session || !session.user) { _user = null; _uid = null; _token = null; fire(); return; }
    _uid = session.user.id;
    _token = session.access_token || null;
    let row = null;
    try {
      const { data } = await sb.from('parent').select('name, state').eq('id', _uid).single();
      row = data;
    } catch {}
    const st = (row && row.state) || {};
    _user = {
      email: session.user.email,
      parentName: (row && row.name) || session.user.user_metadata?.name || '',
      kid: st.kid || null,
      progress: st.progress || { xp: 0, msgs: 0, streak: 1, history: [] },
      concerns: st.concerns || [],
    };
    fire();
  }

  if (sb) {
    sb.auth.getSession().then(({ data }) => hydrate(data.session)).catch(() => fire());
    sb.auth.onAuthStateChange((evt, session) => {
      if (evt === 'PASSWORD_RECOVERY') { try { open('reset'); } catch {} }
      hydrate(session);
    });
  } else {
    console.warn('[NautilusAuth] Supabase not configured — sign-in disabled.');
  }

  /* ---------- Persist the cache to the parent row (debounced upsert) ---------- */
  function schedulePersist() {
    if (!sb || !_uid) return;
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(persistNow, 600);
  }
  async function persistNow() {
    if (!sb || !_uid || !_user) return;
    try {
      await sb.from('parent').upsert({
        id: _uid,
        name: _user.parentName || null,
        state: { kid: _user.kid || null, progress: _user.progress || {}, concerns: _user.concerns || [] },
      });
    } catch (e) { console.warn('[NautilusAuth] save failed', e); }
  }

  function friendlyAuthError(error) {
    const m = (error && error.message) || '';
    if (/already registered|already exists|user.*exists/i.test(m)) return 'An account with that email already exists. Try signing in.';
    if (/invalid login credentials/i.test(m)) return 'That email or password is wrong.';
    if (/email not confirmed/i.test(m)) return 'Please confirm your email first — check your inbox.';
    return m || 'Something went wrong. Please try again.';
  }

  /* ---------- Public API (same shape as before) ---------- */
  async function signup({ email, password, parentName }) {
    email = (email || '').trim().toLowerCase();
    parentName = (parentName || '').trim();
    if (!parentName) throw new Error('Please enter your name.');
    if (!email)      throw new Error('Please enter your email.');
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('That email looks off.');
    if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');
    if (!sb) throw new Error('Sign-in is not configured yet.');

    const { data, error } = await sb.auth.signUp({ email, password, options: { data: { name: parentName } } });
    if (error) throw new Error(friendlyAuthError(error));

    // Carry over any pre-account guest progress.
    let guest = null;
    try {
      const old = localStorage.getItem(LEGACY_KID);
      if (old) {
        const s = JSON.parse(old);
        if (s && (s.history?.length || s.xp)) {
          guest = {
            kid: s.name ? { name: s.name, age: s.age || '6-8' } : null,
            progress: { xp: s.xp || 0, msgs: s.msgs || 0, streak: s.streak || 1, history: s.history || [], _negStreak: s._negStreak || 0 },
          };
        }
      }
    } catch {}

    if (!data.session) {
      // Email confirmation is enabled — no session until they confirm.
      throw new Error('Account created! Check your email to confirm, then sign in.');
    }
    await hydrate(data.session);
    if (guest && _user) {
      _user.kid = guest.kid;
      _user.progress = guest.progress;
      _user.parentName = parentName;
      await persistNow();
    }
    return _user;
  }

  async function signin({ email, password }) {
    email = (email || '').trim().toLowerCase();
    if (!sb) throw new Error('Sign-in is not configured yet.');
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw new Error(friendlyAuthError(error));
    await hydrate(data.session);
    return _user;
  }

  async function signout() {
    try { if (sb) await sb.auth.signOut(); } catch {}
    _user = null; _uid = null; fire();
  }

  /* Send a password-reset email; the link returns here and fires PASSWORD_RECOVERY. */
  async function requestReset(email) {
    if (!sb) throw new Error('Sign-in is not configured yet.');
    email = (email || '').trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('That email looks off.');
    // Always send people back to the live site (never localhost, which may be down).
    const PROD = 'https://nautilusclaw-app.vercel.app';
    const base = global.location.origin.includes('localhost') ? PROD : global.location.origin;
    const redirectTo = base + (global.location.pathname || '/');
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw new Error(friendlyAuthError(error));
  }

  /* Set a new password — only works inside a recovery session (after the email link). */
  async function updatePassword(password) {
    if (!sb) throw new Error('Sign-in is not configured yet.');
    if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');
    const { error } = await sb.auth.updateUser({ password });
    if (error) throw new Error(friendlyAuthError(error));
  }

  function currentUser() { return _user; }

  function updateCurrentUser(patch) {
    if (!_user) return null;
    _user = { ..._user, ...patch };
    schedulePersist();
    return _user;
  }

  async function clearLearningData() {
    if (!sb || !_uid || !_user) throw new Error('Sign in first.');
    clearTimeout(_saveTimer);
    const next = { kid: null, progress: { xp: 0, msgs: 0, streak: 0, history: [] }, concerns: [] };
    const { data, error } = await sb.from('parent').update({ state: next }).eq('id', _uid).select('id');
    if (error || !data || data.length !== 1) throw new Error('Could not confirm data was cleared.');
    _user = { ..._user, ...next };
    fire();
  }

  async function deleteCurrentUser() {
    if (!sb || !_uid) return;
    try { await sb.from('parent').delete().eq('id', _uid); } catch {}
    await signout();
  }

  /* ===============================================================
     UI: shared auth modal injected into any page that calls injectUI()
     =============================================================== */
  const AUTH_CSS = `
    .nc-auth-css-loaded {}
    .nc-auth-backdrop {
      position: fixed; inset: 0;
      background: rgba(7, 24, 43, 0.62);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      display: flex; align-items: center; justify-content: center;
      z-index: 9000;
      padding: 20px;
      opacity: 0; pointer-events: none;
      transition: opacity 240ms;
      font-family: "Instrument Sans", ui-sans-serif, system-ui, sans-serif;
    }
    .nc-auth-backdrop.open { opacity: 1; pointer-events: auto; }
    .nc-auth-card {
      background: #FFF8EC;
      border-radius: 24px;
      max-width: 440px;
      width: 100%;
      max-height: 92vh;
      overflow-y: auto;
      box-shadow: 0 30px 80px -20px rgba(0,0,0,0.5);
      transform: translateY(24px);
      transition: transform 320ms cubic-bezier(.2,.7,.2,1);
      padding: 36px 36px 28px;
      position: relative;
    }
    .nc-auth-backdrop.open .nc-auth-card { transform: translateY(0); }
    .nc-auth-close {
      position: absolute;
      top: 16px; right: 16px;
      width: 36px; height: 36px;
      border-radius: 50%;
      background: #F5EBD9;
      border: none;
      font-size: 20px;
      color: #0D2440;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 200ms;
    }
    .nc-auth-close:hover { background: #ECDFC8; }
    .nc-auth-tabs {
      display: flex;
      gap: 4px;
      background: #F5EBD9;
      border-radius: 12px;
      padding: 4px;
      margin-bottom: 22px;
    }
    .nc-auth-tab {
      flex: 1;
      padding: 10px;
      border-radius: 9px;
      border: none;
      background: transparent;
      font-size: 13px;
      font-weight: 500;
      color: #0D2440;
      cursor: pointer;
      transition: background 200ms, color 200ms;
    }
    .nc-auth-tab.on {
      background: #FFF8EC;
      color: #0D2440;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .nc-auth-eyebrow {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      color: #FF5E3A;
      font-weight: 600;
      margin-bottom: 10px;
    }
    .nc-auth-h1 {
      font-family: "Fraunces", Georgia, serif;
      font-weight: 400;
      font-variation-settings: "opsz" 144, "SOFT" 80;
      font-size: 32px;
      letter-spacing: -0.015em;
      line-height: 1.05;
      color: #0D2440;
      margin: 0 0 8px;
    }
    .nc-auth-h1 em { font-style: italic; font-weight: 300; color: #FF5E3A; }
    .nc-auth-sub {
      font-size: 14px;
      color: rgba(13, 36, 64, 0.7);
      margin: 0 0 22px;
    }
    .nc-auth-label {
      display: block;
      font-size: 10.5px;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: rgba(13, 36, 64, 0.6);
      margin: 14px 0 6px;
      font-weight: 600;
    }
    .nc-auth-input {
      width: 100%;
      padding: 12px 14px;
      border-radius: 10px;
      border: 1.5px solid rgba(13, 36, 64, 0.12);
      background: #FAF3E7;
      font-size: 14.5px;
      color: #0D2440;
      outline: none;
      transition: border-color 200ms;
      font-family: inherit;
    }
    .nc-auth-input:focus { border-color: #FF5E3A; }
    .nc-auth-error {
      color: #D6391A;
      font-size: 12.5px;
      margin: 12px 0 0;
      min-height: 16px;
      line-height: 1.4;
    }
    .nc-auth-submit {
      width: 100%;
      margin-top: 22px;
      padding: 14px;
      border-radius: 999px;
      background: #FF5E3A;
      color: #FAF3E7;
      border: none;
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 6px 20px -4px rgba(255, 94, 58, 0.45);
      transition: background 200ms, transform 120ms;
      font-family: inherit;
    }
    .nc-auth-submit:hover  { background: #D6391A; }
    .nc-auth-submit:active { transform: scale(0.98); }
    .nc-auth-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .nc-auth-foot {
      margin-top: 18px;
      padding-top: 16px;
      border-top: 1px solid rgba(13, 36, 64, 0.08);
      font-size: 12px;
      color: rgba(13, 36, 64, 0.55);
      text-align: center;
      line-height: 1.5;
    }
    .nc-auth-foot strong { color: #0D2440; font-weight: 500; }
    .nc-auth-link {
      color: #FF5E3A;
      cursor: pointer;
      border-bottom: 1px solid #FF5E3A;
      background: none;
      border: none;
      border-bottom: 1px solid #FF5E3A;
      font: inherit;
      padding: 0;
    }
    .nc-auth-userpill {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 6px 14px 6px 6px;
      border-radius: 999px;
      background: rgba(13, 36, 64, 0.06);
      border: 1px solid rgba(13, 36, 64, 0.10);
      font-size: 13.5px;
      color: #0D2440;
      cursor: pointer;
      transition: background 200ms;
      font-family: inherit;
    }
    .nc-auth-userpill:hover { background: rgba(13, 36, 64, 0.10); }
    .nc-auth-userpill .av {
      width: 28px; height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, #FF5E3A, #F4C95D);
      color: #FAF3E7;
      display: inline-flex; align-items: center; justify-content: center;
      font-family: "Fraunces", Georgia, serif;
      font-weight: 500;
      font-size: 13px;
    }
    .nc-auth-menu {
      position: absolute;
      top: calc(100% + 8px); right: 0;
      background: #FFF8EC;
      border: 1px solid rgba(13, 36, 64, 0.10);
      border-radius: 14px;
      padding: 8px;
      min-width: 220px;
      box-shadow: 0 10px 30px -8px rgba(7, 24, 43, 0.20);
      z-index: 8500;
      display: none;
    }
    .nc-auth-menu.open { display: block; }
    .nc-auth-menu .item {
      display: block;
      width: 100%;
      padding: 10px 12px;
      border-radius: 8px;
      background: none;
      border: none;
      text-align: left;
      font-size: 13.5px;
      color: #0D2440;
      cursor: pointer;
      font-family: inherit;
      transition: background 200ms;
    }
    .nc-auth-menu .item:hover { background: #F5EBD9; }
    .nc-auth-menu .item.danger { color: #D6391A; }
    .nc-auth-menu .info {
      padding: 10px 12px 12px;
      border-bottom: 1px solid rgba(13, 36, 64, 0.08);
      margin-bottom: 6px;
    }
    .nc-auth-menu .info strong {
      display: block;
      font-family: "Fraunces", Georgia, serif;
      font-weight: 500;
      font-size: 14px;
      letter-spacing: -0.005em;
    }
    .nc-auth-menu .info small {
      display: block;
      font-size: 11.5px;
      color: rgba(13, 36, 64, 0.55);
      margin-top: 2px;
    }
    @media (max-width: 480px) {
      .nc-auth-card { padding: 28px 24px 22px; border-radius: 20px; }
      .nc-auth-h1 { font-size: 26px; }
    }
  `;

  const AUTH_HTML = `
    <div class="nc-auth-backdrop" id="nc-auth-backdrop" role="dialog" aria-modal="true" aria-labelledby="nc-auth-title">
      <div class="nc-auth-card">
        <button class="nc-auth-close" id="nc-auth-close" aria-label="Close">×</button>

        <div class="nc-auth-tabs">
          <button class="nc-auth-tab on" data-tab="signin" id="nc-tab-signin">Sign in</button>
          <button class="nc-auth-tab"    data-tab="signup" id="nc-tab-signup">Create account</button>
        </div>

        <!-- Sign in panel -->
        <div id="nc-pane-signin" class="nc-auth-pane">
          <div class="nc-auth-eyebrow">Welcome back</div>
          <h2 class="nc-auth-h1" id="nc-auth-title">Hi, <em>friend.</em></h2>
          <p class="nc-auth-sub">Sign in to keep your child's progress and conversations.</p>
          <form id="nc-form-signin">
            <label class="nc-auth-label" for="nc-signin-email">Email</label>
            <input class="nc-auth-input" type="email" id="nc-signin-email" required autocomplete="email" />
            <label class="nc-auth-label" for="nc-signin-pass">Password</label>
            <input class="nc-auth-input" type="password" id="nc-signin-pass" required autocomplete="current-password" />
            <div class="nc-auth-error" id="nc-signin-error"></div>
            <button type="submit" class="nc-auth-submit" id="nc-signin-submit">Sign in</button>
          </form>
          <div class="nc-auth-foot">
            <button class="nc-auth-link" id="nc-forgot" type="button">Forgot your password?</button>
            <div style="margin-top:8px;">New here? <button class="nc-auth-link" id="nc-go-signup">Create a free account</button></div>
          </div>
        </div>

        <!-- Sign up panel -->
        <div id="nc-pane-signup" class="nc-auth-pane" style="display:none;">
          <div class="nc-auth-eyebrow">Parent account · Beta</div>
          <h2 class="nc-auth-h1">Create your <em>account.</em></h2>
          <p class="nc-auth-sub">For parents and guardians. Account profiles and chat activity are saved through Supabase. Read our <a href="/guide#privacy">privacy information</a> before continuing.</p>
          <form id="nc-form-signup">
            <label class="nc-auth-label" for="nc-signup-name">Your name</label>
            <input class="nc-auth-input" type="text" id="nc-signup-name" required autocomplete="name" />
            <label class="nc-auth-label" for="nc-signup-email">Email</label>
            <input class="nc-auth-input" type="email" id="nc-signup-email" required autocomplete="email" />
            <label class="nc-auth-label" for="nc-signup-pass">Password <small style="color:rgba(13,36,64,0.4);text-transform:none;letter-spacing:0;font-size:11px;font-weight:400;">(at least 6 characters)</small></label>
            <input class="nc-auth-input" type="password" id="nc-signup-pass" required autocomplete="new-password" minlength="6" />
            <div class="nc-auth-error" id="nc-signup-error"></div>
            <button type="submit" class="nc-auth-submit" id="nc-signup-submit">Create my free account</button>
          </form>
          <div class="nc-auth-foot">
            Already have one? <button class="nc-auth-link" id="nc-go-signin">Sign in</button>
          </div>
        </div>

        <!-- Reset password panel (request a link, or set a new password after clicking it) -->
        <div id="nc-pane-reset" class="nc-auth-pane" style="display:none;">
          <div class="nc-auth-eyebrow">Reset password</div>
          <h2 class="nc-auth-h1">Set a new <em>password.</em></h2>
          <p class="nc-auth-sub">Choose a new password for your account.</p>
          <form id="nc-form-reset">
            <label class="nc-auth-label" for="nc-reset-pass">New password</label>
            <input class="nc-auth-input" type="password" id="nc-reset-pass" required autocomplete="new-password" minlength="6" />
            <div class="nc-auth-error" id="nc-reset-error"></div>
            <button type="submit" class="nc-auth-submit" id="nc-reset-submit">Update password</button>
          </form>
        </div>

      </div>
    </div>
  `;

  let _injected = false;
  function injectUI() {
    if (_injected || document.getElementById('nc-auth-backdrop')) return;
    _injected = true;
    if (!document.getElementById('nc-auth-css')) {
      const s = document.createElement('style');
      s.id = 'nc-auth-css';
      s.textContent = AUTH_CSS;
      document.head.appendChild(s);
    }
    const wrap = document.createElement('div');
    wrap.innerHTML = AUTH_HTML;
    document.body.appendChild(wrap.firstElementChild);
    wireUI();
  }

  function wireUI() {
    const backdrop = document.getElementById('nc-auth-backdrop');
    const close    = document.getElementById('nc-auth-close');
    const tabSignin = document.getElementById('nc-tab-signin');
    const tabSignup = document.getElementById('nc-tab-signup');
    const paneSignin = document.getElementById('nc-pane-signin');
    const paneSignup = document.getElementById('nc-pane-signup');
    const goSignup = document.getElementById('nc-go-signup');
    const goSignin = document.getElementById('nc-go-signin');
    const formSignin = document.getElementById('nc-form-signin');
    const formSignup = document.getElementById('nc-form-signup');
    const errSignin  = document.getElementById('nc-signin-error');
    const errSignup  = document.getElementById('nc-signup-error');

    function showTab(name) {
      tabSignin.classList.toggle('on', name === 'signin');
      tabSignup.classList.toggle('on', name === 'signup');
      paneSignin.style.display = name === 'signin' ? '' : 'none';
      paneSignup.style.display = name === 'signup' ? '' : 'none';
      const paneReset = document.getElementById('nc-pane-reset');
      if (paneReset) paneReset.style.display = 'none';
      const tabs = document.querySelector('.nc-auth-tabs');
      if (tabs) tabs.style.display = '';
      errSignin.style.color = ''; errSignin.textContent = '';
      errSignup.textContent = '';
    }

    tabSignin.addEventListener('click', () => showTab('signin'));
    tabSignup.addEventListener('click', () => showTab('signup'));
    goSignup.addEventListener('click', () => showTab('signup'));
    goSignin.addEventListener('click', () => showTab('signin'));

    function close_() { backdrop.classList.remove('open'); }
    close.addEventListener('click', close_);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close_(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && backdrop.classList.contains('open')) close_();
    });

    formSignin.addEventListener('submit', async (e) => {
      e.preventDefault();
      errSignin.textContent = '';
      const btn = document.getElementById('nc-signin-submit');
      btn.disabled = true; btn.textContent = 'Signing in…';
      try {
        await signin({
          email: document.getElementById('nc-signin-email').value,
          password: document.getElementById('nc-signin-pass').value,
        });
        close_();
      } catch (err) {
        errSignin.textContent = err.message || 'Could not sign in.';
      } finally {
        btn.disabled = false; btn.textContent = 'Sign in';
      }
    });

    formSignup.addEventListener('submit', async (e) => {
      e.preventDefault();
      errSignup.textContent = '';
      const btn = document.getElementById('nc-signup-submit');
      btn.disabled = true; btn.textContent = 'Creating…';
      try {
        await signup({
          parentName: document.getElementById('nc-signup-name').value,
          email: document.getElementById('nc-signup-email').value,
          password: document.getElementById('nc-signup-pass').value,
        });
        close_();
      } catch (err) {
        errSignup.textContent = err.message || 'Could not create account.';
      } finally {
        btn.disabled = false; btn.textContent = 'Create my free account';
      }
    });

    // Forgot password — email a reset link
    const forgot = document.getElementById('nc-forgot');
    forgot?.addEventListener('click', async () => {
      const emailEl = document.getElementById('nc-signin-email');
      const email = (emailEl.value || '').trim().toLowerCase();
      if (!email) {
        errSignin.style.color = '';
        errSignin.textContent = 'Enter your email above first, then tap "Forgot your password?".';
        emailEl.focus();
        return;
      }
      forgot.disabled = true;
      const orig = forgot.textContent; forgot.textContent = 'Sending…';
      try {
        await requestReset(email);
        errSignin.style.color = '#1f9e8f';
        errSignin.textContent = 'Check your email for a reset link. 📧';
      } catch (err) {
        errSignin.style.color = '';
        errSignin.textContent = err.message || 'Could not send the reset email.';
      } finally {
        forgot.disabled = false; forgot.textContent = orig;
      }
    });

    // Set a new password after returning from the reset link
    const formReset = document.getElementById('nc-form-reset');
    const errReset = document.getElementById('nc-reset-error');
    formReset?.addEventListener('submit', async (e) => {
      e.preventDefault();
      errReset.style.color = ''; errReset.textContent = '';
      const btn = document.getElementById('nc-reset-submit');
      btn.disabled = true; btn.textContent = 'Updating…';
      try {
        await updatePassword(document.getElementById('nc-reset-pass').value);
        errReset.style.color = '#1f9e8f';
        errReset.textContent = 'Password updated! 🎉';
        setTimeout(close_, 1400);
      } catch (err) {
        errReset.style.color = ''; errReset.textContent = err.message || 'Could not update password.';
      } finally {
        btn.disabled = false; btn.textContent = 'Update password';
      }
    });
  }

  function open(mode = 'signin') {
    injectUI();
    const backdrop = document.getElementById('nc-auth-backdrop');
    if (mode === 'reset') {
      document.getElementById('nc-pane-signin').style.display = 'none';
      document.getElementById('nc-pane-signup').style.display = 'none';
      document.getElementById('nc-pane-reset').style.display = '';
      const tabs = document.querySelector('.nc-auth-tabs');
      if (tabs) tabs.style.display = 'none';
    } else {
      const tabs = document.querySelector('.nc-auth-tabs');
      if (tabs) tabs.style.display = '';
      document.querySelector(`#nc-tab-${mode === 'signup' ? 'signup' : 'signin'}`)?.click();
    }
    backdrop.classList.add('open');
    setTimeout(() => {
      const focusEl = document.getElementById(
        mode === 'signup' ? 'nc-signup-name' : (mode === 'reset' ? 'nc-reset-pass' : 'nc-signin-email')
      );
      focusEl?.focus();
    }, 220);
  }
  function close() {
    document.getElementById('nc-auth-backdrop')?.classList.remove('open');
  }

  /* User pill + menu — for placement in page headers */
  function renderUserPill(targetEl, opts = {}) {
    if (!targetEl) return;
    const u = currentUser();
    targetEl.innerHTML = '';
    if (!u) {
      const btn = document.createElement('button');
      btn.className = 'nc-auth-userpill';
      btn.style.padding = '8px 18px';
      btn.textContent = opts.signedOutLabel || 'Sign in';
      btn.addEventListener('click', () => open('signin'));
      targetEl.appendChild(btn);
      return;
    }
    targetEl.style.position = 'relative';
    const initial = (u.parentName || u.email || 'U').trim().charAt(0).toUpperCase();
    const wrap = document.createElement('div');
    wrap.style.position = 'relative';
    wrap.innerHTML = `
      <button class="nc-auth-userpill" id="nc-pill-btn" type="button">
        <span class="av">${initial}</span>
        <span>${escapeHTML(u.parentName || u.email)}</span>
      </button>
      <div class="nc-auth-menu" id="nc-pill-menu">
        <div class="info">
          <strong>${escapeHTML(u.parentName || 'You')}</strong>
          <small>${escapeHTML(u.email)}</small>
        </div>
        ${opts.menu ? opts.menu.map(item =>
          `<button class="item${item.danger ? ' danger' : ''}" data-action="${item.id}">${item.label}</button>`
        ).join('') : ''}
        <button class="item danger" data-action="signout">Sign out</button>
      </div>
    `;
    targetEl.appendChild(wrap);
    const btn = wrap.querySelector('#nc-pill-btn');
    const menu = wrap.querySelector('#nc-pill-menu');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) menu.classList.remove('open');
    });
    menu.addEventListener('click', (e) => {
      const action = e.target?.dataset?.action;
      if (!action) return;
      menu.classList.remove('open');
      if (action === 'signout') {
        signout();
      } else if (typeof opts.onAction === 'function') {
        opts.onAction(action);
      }
    });
  }

  function escapeHTML(s) {
    return (s || '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  /* ---------- Expose ---------- */
  global.NautilusAuth = {
    signup, signin, signout,
    requestReset, updatePassword,
    currentUser, updateCurrentUser, deleteCurrentUser, clearLearningData,
    getToken: () => _token,
    on, open, close, injectUI, renderUserPill,
  };
})(window);
