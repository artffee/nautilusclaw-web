/* Supabase parent accounts. Guest activity is never imported into an account. */
(function (global) {
  'use strict';
  const cfg = global.SUPABASE_CONFIG;
  const memory = new Map();
  const storage = {
    getItem(key) { try { return global.sessionStorage.getItem(key); } catch { return memory.get(key) || null; } },
    setItem(key, value) { try { global.sessionStorage.setItem(key, value); } catch { memory.set(key, value); } },
    removeItem(key) { try { global.sessionStorage.removeItem(key); } catch {} memory.delete(key); },
  };
  const storageKey = 'nautilus-parent-auth';
  const sb = cfg && cfg.accountsEnabled !== false && global.supabase && /^https:\/\//.test(cfg.url || '')
    ? global.supabase.createClient(cfg.url, cfg.anonKey, {auth: {storage, storageKey, persistSession: true, detectSessionInUrl: true}}) : null;
  let _user = null, _uid = null, _token = null, _saveTimer = null, generation = 0, recovery = false, locallySignedOut = false;
  const listeners = new Set();
  function on(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  function fire() { listeners.forEach(fn => { try { fn(_user); } catch {} }); }
  function clearSession() {
    generation++; clearTimeout(_saveTimer); _saveTimer = null;
    _user = null; _uid = null; _token = null; recovery = false; fire();
  }
  async function hydrate(session) {
    if (locallySignedOut) return;
    if (!session?.user) { clearSession(); return; }
    const id = session.user.id, request = ++generation;
    _token = session.access_token || null;
    if (_uid === id && _user) { fire(); return; }
    clearTimeout(_saveTimer); _user = null; _uid = id;
    // A profile read must succeed before account state can be edited or saved.
    const { data: row, error } = await sb.from('parent').select('name, state').eq('id', id).single();
    if (request !== generation || _uid !== id) return;
    if (error || !row) { _token = null; fire(); throw new Error('Your account data could not load. Please try signing in again.'); }
    const st = row.state || {};
    _user = {email: session.user.email, parentName: row.name || '', kid: st.kid || null,
      progress: st.progress || {xp: 0, msgs: 0, streak: 1, history: []}, concerns: st.concerns || []};
    fire();
  }
  const initialGeneration = generation;
  const ready = sb ? sb.auth.getSession().then(({data, error}) => {
    if (initialGeneration !== generation || locallySignedOut) return;
    if (error) throw error;
    return hydrate(data.session);
  }).catch(() => { fire(); }) : Promise.resolve();
  if (sb) sb.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') { locallySignedOut = true; clearSession(); return; }
    if (locallySignedOut) return;
    if (event === 'PASSWORD_RECOVERY') recovery = true;
    // Never call Supabase inside its auth lock. Invalidate queued work at sign-out.
    const queued = generation;
    setTimeout(() => {
      if (queued !== generation || locallySignedOut) return;
      hydrate(session).catch(() => fire());
    }, 0);
  });
  function schedulePersist() {
    clearTimeout(_saveTimer);
    if (!sb || !_uid || !_user) return;
    const id = _uid;
    _saveTimer = setTimeout(() => { if (id === _uid) persistNow(); }, 600);
  }
  async function persistNow() {
    if (!sb || !_uid || !_user) return;
    const row = {id: _uid, name: _user.parentName || null,
      state: {kid: _user.kid || null, progress: _user.progress || {}, concerns: _user.concerns || []}};
    try { const {error} = await sb.from('parent').upsert(row); if (error) throw error; }
    catch { console.warn('[NautilusAuth] Account changes could not be saved.'); }
  }
  function friendlyAuthError(error) {
    const code = error?.code || '', status = error?.status;
    if (status === 429 || /rate_limit/.test(code)) return 'Too many attempts. Please wait a little before trying again.';
    if (status >= 500 || /fetch|network/i.test(error?.message || '')) return 'The account service is unavailable right now. Please try again later. Guest adventures are still free to explore.';
    if (/weak_password/.test(code)) return 'Choose a longer, unique password that you have not used elsewhere.';
    return 'We could not complete that request. Check your email and password, or use the password reset link.';
  }
  function requireService() { if (!sb) throw new Error('The account service could not load. Please reload this page.'); }
  function emailValue(value) {
    const email = String(value || '').trim().toLowerCase();
    if (email.length > 254 || !/^\S+@\S+\.\S+$/.test(email)) throw new Error('Please enter a valid email address.');
    return email;
  }
  function strongPassword(value) {
    if (typeof value !== 'string' || value.length < 12 || value.length > 128) throw new Error('Choose a password between 12 and 128 characters.');
  }
  function callbackURL(mode) {
    const origin = ['https://nautilusclaw.com', 'https://www.nautilusclaw.com', 'https://nautilusclaw-app.vercel.app'].includes(global.location?.origin)
      ? global.location.origin : 'https://nautilusclaw.com';
    return origin + '/login?mode=' + mode;
  }
  async function signup({email, password}) {
    requireService(); email = emailValue(email); strongPassword(password); locallySignedOut = false;
    const {data, error} = await sb.auth.signUp({email, password, options: {emailRedirectTo: callbackURL('signin')}});
    if (error) {
      if (/already|exists/.test(error.code || '')) return {confirmationRequired: true};
      throw new Error(friendlyAuthError(error));
    }
    if (!data.session) return {confirmationRequired: true};
    await sb.auth.startAutoRefresh?.();
    await hydrate(data.session); return {user: _user, confirmationRequired: false};
  }
  async function signin({email, password}) {
    requireService(); email = emailValue(email); locallySignedOut = false;
    if (!password || password.length > 128) throw new Error('Please enter your password.');
    const {data, error} = await sb.auth.signInWithPassword({email, password});
    if (error) throw new Error(friendlyAuthError(error));
    await sb.auth.startAutoRefresh?.();
    await hydrate(data.session); return _user;
  }
  async function signout() {
    locallySignedOut = true; clearSession();
    try { if (sb) { await sb.auth.signOut({scope: 'local'}); await sb.auth.stopAutoRefresh?.(); } }
    finally {
      storage.removeItem(storageKey); storage.removeItem(storageKey + '-code-verifier');
      // Remove the earlier SDK's persistent session on shared devices too.
      try { global.localStorage.removeItem('sb-' + new URL(cfg.url).hostname.split('.')[0] + '-auth-token'); } catch {}
      clearSession();
    }
  }
  async function requestReset(email) {
    requireService(); email = emailValue(email);
    const {error} = await sb.auth.resetPasswordForEmail(email, {redirectTo: callbackURL('reset')});
    if (error) throw new Error(friendlyAuthError(error));
  }
  async function updatePassword(password) {
    requireService(); strongPassword(password);
    if (!recovery || !_token) throw new Error('Open a new password reset link from your email first.');
    const {error} = await sb.auth.updateUser({password});
    if (error) throw new Error(friendlyAuthError(error));
    await signout();
  }
  function currentUser() { return _user; }
  function updateCurrentUser(patch) { if (!_user) return null; _user = {..._user, ...patch}; schedulePersist(); return _user; }
  async function clearLearningData() {
    if (!sb || !_uid || !_user) throw new Error('Sign in first.');
    clearTimeout(_saveTimer);
    const id = _uid, request = generation;
    const next = {kid: null, progress: {xp: 0, msgs: 0, streak: 0, history: []}, concerns: []};
    const {data, error} = await sb.from('parent').update({state: next}).eq('id', id).select('id');
    if (error || !data || data.length !== 1) throw new Error('Could not confirm data was cleared.');
    if (id !== _uid || request !== generation) return;
    _user = {..._user, ...next}; fire();
  }
  async function deleteCurrentUser() {
    if (!sb || !_uid) return;
    const {error} = await sb.from('parent').delete().eq('id', _uid);
    if (error) throw new Error('Account data could not be deleted.');
    await signout();
  }
  function open(mode = 'signin') {
    const next = ['/parent','/billing','/app'].includes(global.location.pathname) ? global.location.pathname + global.location.search : '/parent';
    global.location.assign('/login?mode=' + (['signin','signup','reset'].includes(mode) ? mode : 'signin') + '&next=' + encodeURIComponent(next));
  }
  function close() {}
  function injectUI() {
    if (document.getElementById('nc-auth-css')) return;
    const style = document.createElement('style'); style.id = 'nc-auth-css'; style.textContent = PILL_CSS; document.head.append(style);
  }

  const PILL_CSS = `    .nc-auth-userpill {
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
`;
  /* User pill + menu — for placement in page headers */
  function renderUserPill(targetEl, opts = {}) {
    if (!targetEl) return;
    injectUI();
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
        <span class="av">${escapeHTML(initial)}</span>
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

  global.NautilusAuth = {signup, signin, signout, requestReset, updatePassword, currentUser,
    updateCurrentUser, deleteCurrentUser, clearLearningData, getToken: () => _token,
    isAvailable: () => !!sb, isRecovery: () => recovery, ready, on, open, close, injectUI, renderUserPill};
})(window);
