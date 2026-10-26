import {PLANS} from './plans.js';
const $ = s => document.querySelector(s);
const money = cents => new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD', maximumFractionDigits: cents % 100 ? 2 : 0}).format(cents / 100);
let plan = new URLSearchParams(location.search).get('plan') === 'yearly' ? 'yearly' : 'monthly';
let ready = false, busy = false, loadId = 0, pendingCheckout = false;
const status = $('#billingMessage');
function message(text, warning = false) {if (status) {status.textContent = text;status.classList.toggle('warning', warning);}}
function selectPlan(name) {
  plan = name;
  document.querySelectorAll('[data-plan]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.plan === plan)));
  document.querySelectorAll('[data-family-price]').forEach(e => e.textContent = money(PLANS[plan].amount));
  document.querySelectorAll('[data-family-interval]').forEach(e => e.textContent = plan === 'yearly' ? '/ year' : '/ month');
  document.querySelectorAll('[data-family-terms]').forEach(e => e.textContent = plan === 'yearly' ? '$59 billed once a year. Renews annually. Save $24.88 compared with 12 monthly payments.' : '$6.99 billed every month. Renews monthly.');
  document.querySelectorAll('[data-plan-link]').forEach(e => e.href = '/billing?plan=' + plan);
}
document.querySelectorAll('[data-plan]').forEach(b => b.onclick = () => selectPlan(b.dataset.plan));
selectPlan(plan);

async function api(action, body) {
  const headers = {'content-type': 'application/json'};
  const token = window.NautilusAuth?.getToken();
  if (token) headers.authorization = 'Bearer ' + token;
  const response = await fetch('/api/billing' + (body ? '' : '?action=' + action), {
    method: body ? 'POST' : 'GET', headers,
    ...(body ? {body: JSON.stringify({action, ...body})} : {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Billing could not be reached. Please try again.');
  return data;
}
function redirect(url, hostname) {
  const target = new URL(url);
  if (target.protocol !== 'https:' || target.hostname !== hostname) throw new Error('The billing link could not be verified. Please try again.');
  location.assign(target.href);
}
async function checkout() {
  if (busy || !ready) return;
  if (!$('#adultConfirm')?.checked) {message('Please confirm that you are the parent or guardian purchasing this subscription.', true);$('#adultConfirm')?.focus();return;}
  if (!window.NautilusAuth?.currentUser()) {pendingCheckout = true;NautilusAuth.open('signin');return;}
  busy = true;$('#checkoutButton').disabled = true;message('Opening secure Stripe checkout…');
  try {const result = await api('checkout', {plan, adultConfirmed: true});redirect(result.url, 'checkout.stripe.com');}
  catch (e) {message(e.message, true);}
  finally {busy = false;$('#checkoutButton').disabled = !ready;}
}
async function refresh() {
  const generation = ++loadId;
  const u = window.NautilusAuth?.currentUser();
  $('#accountEmail').textContent = u ? u.email : 'Sign in with your parent email to keep billing connected to your account.';
  $('#accountActions').hidden = !!u;
  $('#signOutBilling').hidden = !u;
  $('#manageBilling').hidden = true;
  $('#purchaseSection').hidden = false;
  $('#renewalState').textContent = '';
  $('#openApp').hidden = true;
  $('#subscriptionState').textContent = u ? 'Checking your plan…' : 'Free guest adventure';
  if (!u || !ready) {$('#subscriptionState').textContent = ready ? 'Free guest adventure' : 'Family subscriptions are not open yet';return;}
  try {
    const s = await api('status');
    if (generation !== loadId) return;
    $('#manageBilling').hidden = !s.canManage;
    $('#purchaseSection').hidden = s.hasSubscription;
    if (s.active) {
      const date = s.periodEnd ? new Date(s.periodEnd * 1000).toLocaleDateString(undefined, {dateStyle: 'medium'}) : '';
      $('#subscriptionState').textContent = `Family · ${s.plan === 'yearly' ? 'Yearly' : 'Monthly'}${s.mode === 'test' ? ' · Sandbox' : ''}`;
      $('#renewalState').textContent = s.cancelAtPeriodEnd ? `Cancellation scheduled. Access continues until ${date}.` : `Next renewal: ${date}.`;
      $('#openApp').hidden = false;
      message('Your Family access is confirmed.');
    } else if (s.hasSubscription) {
      $('#subscriptionState').textContent = 'Family · Payment needs attention';
      $('#renewalState').textContent = 'Use Manage billing to review your invoice or payment method. AI access resumes after payment is confirmed.';
    } else {
      $('#subscriptionState').textContent = 'Free guest adventure';
      $('#renewalState').textContent = 'No active Family subscription.';
    }
  } catch (e) {if (generation === loadId) {$('#subscriptionState').textContent = 'Plan could not be verified';message(e.message, true);}}
}
function script(src) {return new Promise((resolve, reject) => {const e = document.createElement('script');e.src = src;e.onload = resolve;e.onerror = reject;document.head.appendChild(e);});}
async function init() {
  try {
    const cfg = await api('config');ready = cfg.ready;
    document.querySelectorAll('[data-availability]').forEach(e => e.textContent = !ready ? 'Family is coming soon. The guest adventure is free today.' : cfg.mode === 'test' ? 'Sandbox checkout — test payments only. No real money is charged.' : 'Secure checkout with Stripe. Parent account required.');
    if (!$('#billingAccount')) return;
    $('#checkoutButton').disabled = !ready;
    $('#checkoutButton').textContent = !ready ? 'Family checkout coming soon' : cfg.mode === 'test' ? 'Open test checkout ↗' : 'Continue to Stripe ↗';
    await script('/vendor/supabase.js');
    await script('/supabase-config.js');await script('/auth.js');
    NautilusAuth.on(() => {refresh();if (pendingCheckout && NautilusAuth.currentUser()) {pendingCheckout = false;message('Signed in. Review your selection, then continue to Stripe.');}});
    $('#signInBilling').onclick = () => NautilusAuth.open('signin');
    $('#signUpBilling').onclick = () => NautilusAuth.open('signup');
    $('#signOutBilling').onclick = () => NautilusAuth.signout();
    $('#checkoutButton').onclick = checkout;
    $('#refreshBilling').onclick = refresh;
    $('#manageBilling').onclick = async () => {
      const b = $('#manageBilling');b.disabled = true;message('Opening Stripe billing…');
      try {const result = await api('portal', {});redirect(result.url, 'billing.stripe.com');}
      catch (e) {message(e.message, true);b.disabled = false;}
    };
    const outcome = new URLSearchParams(location.search).get('checkout');
    if (outcome === 'success') message('Thanks. Checking payment with Stripe. If it is still processing, refresh your plan in a moment.');
    if (outcome === 'canceled') message('Checkout closed. No new payment has been confirmed here. You can try again or return to the free adventure.');
    await refresh();
  } catch (e) {
    document.querySelectorAll('[data-availability]').forEach(el => el.textContent = 'Family checkout is temporarily unavailable. The guest adventure is free.');
    message('Billing could not load. Please reload this page.', true);
    if ($('#checkoutButton')) $('#checkoutButton').disabled = true;
  }
}
init();

