// The only catalog accepted by the server; clients cannot submit an amount.
export const PLANS = Object.freeze({
  monthly: Object.freeze({amount: 699, currency: 'usd', interval: 'month', lookup: 'nautilus_family_monthly'}),
  yearly: Object.freeze({amount: 5900, currency: 'usd', interval: 'year', lookup: 'nautilus_family_yearly'}),
});
export const APP = 'nautilusclaw';
