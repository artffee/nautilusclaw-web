export function safeDestination(value) {
  try {
    if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\r\n]/.test(value)) return '/parent';
    const url = new URL(value, 'https://nautilusclaw.com');
    if (url.origin !== 'https://nautilusclaw.com' || !['/parent','/app','/billing'].includes(url.pathname)) return '/parent';
    // Only retain the billing period, never arbitrary query strings or fragments.
    const plan = url.searchParams.get('plan');
    return url.pathname + (url.pathname === '/billing' && ['monthly','yearly'].includes(plan) ? '?plan=' + plan : '');
  } catch { return '/parent'; }
}
export function loginMode(value) { return ['signin','signup','forgot','reset'].includes(value) ? value : 'signin'; }
