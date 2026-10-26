import {safeDestination, loginMode} from './login-core.mjs';
const $ = s => document.querySelector(s);
const params = new URLSearchParams(location.search);
const next = safeDestination(params.get('next'));
let mode = loginMode(params.get('mode')), busy = false;
const form = $('#loginForm'), status = $('#formStatus'), password = $('#password'), email = $('#email');
const copy = {
  signin: ['Welcome back.', 'A little sign-in. A whole lot of wonder.', 'Sign in'],
  signup: ['Make room for wonder.', 'Create your own grown-up account.', 'Create parent account'],
  forgot: ['Let’s get you back in.', 'We’ll send a password reset link to your email.', 'Send reset link'],
  reset: ['A fresh start.', 'Choose a new password for your parent account.', 'Update password'],
};
function message(text, error = false) { status.textContent = text; status.dataset.error = String(error); }
function showMode(value, focus = false) {
  mode = loginMode(value); const text = copy[mode];
  $('#formTitle').textContent = text[0]; $('#formIntro').textContent = text[1]; $('#submitText').textContent = text[2];
  $('#emailField').hidden = mode === 'reset'; email.disabled = mode === 'reset';
  $('#passwordField').hidden = mode === 'forgot'; password.disabled = mode === 'forgot';
  password.autocomplete = ['signup','reset'].includes(mode) ? 'new-password' : 'current-password';
  password.minLength = ['signup','reset'].includes(mode) ? 12 : 1;
  password.type = 'password'; password.value = ''; $('#togglePassword').textContent = 'Show'; $('#togglePassword').setAttribute('aria-label','Show password'); $('#togglePassword').setAttribute('aria-pressed','false');
  $('#passwordHint').hidden = !['signup','reset'].includes(mode); $('#capsWarning').hidden = true;
  $('#forgotLink').hidden = mode !== 'signin';
  $('#adultField').hidden = mode !== 'signup'; $('#adult').required = mode === 'signup'; $('#adult').disabled = mode !== 'signup';
  $('#accountDisclosure').textContent = mode === 'signup' ? 'Your email and account activity are stored with Supabase. Guest adventures stay separate. Read our privacy information before creating an account.' : 'For grown-ups only. Your sign-in stays in this browser tab. Please sign out on shared devices.';
  if (mode === 'signup') { const a = document.createElement('a'); a.href='/guide#privacy'; a.textContent=' Privacy information →'; $('#accountDisclosure').append(a); }
  document.querySelectorAll('.form-tabs a').forEach(a => { if(a.dataset.mode === mode) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
  message(''); if(focus) $('#formTitle').focus();
  if (mode === 'reset' && window.NautilusAuth && !NautilusAuth.isRecovery()) message('Open the password reset link in your email to choose a new password. You can request a fresh link under “Forgot password?”.',true);
}
function refreshAccount() {
  const auth = window.NautilusAuth;
  if(auth?.isRecovery()) { if(mode !== 'reset') showMode('reset'); return; }
  const signedIn = !!auth?.currentUser();
  $('#accountReady').hidden = !signedIn; form.hidden = signedIn;
  $('.form-tabs').hidden = signedIn;
  if(signedIn) { $('#formTitle').textContent='You’re all set.'; $('#formIntro').textContent='Your next little discovery is waiting.'; }
}
document.querySelectorAll('[data-mode]').forEach(a => {
  a.href = '/login?mode=' + a.dataset.mode + '&next=' + encodeURIComponent(next);
  a.addEventListener('click',e => { if(busy) { e.preventDefault(); return; } e.preventDefault(); history.replaceState(null,'',a.href); showMode(a.dataset.mode,true); });
});
$('#dashboardLink').href = next;
$('#togglePassword').addEventListener('click',() => { const show=password.type === 'password'; password.type=show?'text':'password'; $('#togglePassword').textContent=show?'Hide':'Show'; $('#togglePassword').setAttribute('aria-label',show?'Hide password':'Show password'); $('#togglePassword').setAttribute('aria-pressed',String(show)); });
password.addEventListener('keyup',e => { $('#capsWarning').hidden = !e.getModifierState('CapsLock'); });
$('#switchAccount').addEventListener('click',async () => { try { await NautilusAuth.signout(); showMode('signin'); refreshAccount(); } catch { message('You are signed out of this page. Close this tab before sharing this device.',true); } });
form.addEventListener('submit', async e => {
  e.preventDefault(); if(busy || !form.reportValidity()) return;
  const auth=window.NautilusAuth;
  if(!auth) { message('Sign-in could not load. Please reload the page or enjoy a guest adventure.',true); return; }
  busy=true; $('#submitButton').disabled=true; form.setAttribute('aria-busy','true'); message(''); $('#submitText').textContent='One moment…';
  try {
    if(mode === 'signin') { const user=await auth.signin({email:email.value,password:password.value}); if(!user) throw new Error('Your account could not load. Please try again.'); location.assign(next); }
    else if(mode === 'signup') { const result=await auth.signup({email:email.value,password:password.value}); password.value=''; if(result.confirmationRequired) message('Check your inbox. If this address can receive an account link, you’ll find the next step there. Already registered? Sign in or reset your password.'); else location.assign(next); }
    else if(mode === 'forgot') { await auth.requestReset(email.value); message('If there’s an account for that email, a reset link is on its way. Check your inbox and spam folder.'); }
    else { await auth.updatePassword(password.value); showMode('signin'); message('Your password has been updated. Sign in with your new password.'); }
  } catch(error) { message(error.message || 'We couldn’t connect. Please try again.',true); }
  finally { password.value=''; busy=false; $('#submitButton').disabled=false; $('#submitText').textContent=copy[mode][2]; form.removeAttribute('aria-busy'); }
});
showMode(mode);
// Defer scripts and this module have all completed before DOMContentLoaded.
async function initialize() {
  if(!window.NautilusAuth) { message('The account service could not load. Please reload this page. Guest adventures are still available.',true); return; }
  NautilusAuth.on(refreshAccount); await NautilusAuth.ready; refreshAccount();
  if (new URLSearchParams(location.hash.slice(1)).has('error_description')) {
    history.replaceState(null,'',location.pathname + location.search); message('That email link is no longer usable. Please request a fresh password reset link.',true);
  }
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',initialize,{once:true}); else initialize();
