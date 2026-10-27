// The only catalog accepted by the server; clients cannot submit an amount.
export const PLANS = Object.freeze({
  monthly: Object.freeze({amount: 699, currency: 'usd', interval: 'month', lookup: 'nautilus_family_monthly'}),
  yearly: Object.freeze({amount: 5900, currency: 'usd', interval: 'year', lookup: 'nautilus_family_yearly'}),
});
export const APP = 'nautilusclaw';


// A single server-owned offer. Guests and monthly subscribers are unaffected.
export const FAMILY_TRIAL = Object.freeze({days: 7, plan: 'yearly', offer: 'annual-7day-v1'});
export function familyOffer(plan, eligible = true) {
  const trial = plan === FAMILY_TRIAL.plan && eligible;
  return {
    trial,
    terms: trial
      ? '$0 subscription charge today. After 7 days, $59/year unless you cancel before the trial ends. Renews annually.'
      : plan === 'yearly' ? '$59 charged at checkout. Renews annually. Save $24.88 compared with 12 monthly payments.'
      : '$6.99 charged at checkout. Renews monthly. No free trial on the monthly plan.',
    consent: trial
      ? 'I am a parent or guardian. I understand the 7-day trial renews at $59/year unless I cancel before it ends.'
      : plan === 'yearly' ? 'I am a parent or guardian. I agree to $59 at checkout and annual renewal until canceled.'
      : 'I am a parent or guardian. I agree to $6.99 at checkout and monthly renewal until canceled.',
  };
}
