// Mirrors the backend's COIN_TO_CASH_RATE (see backend/.env.example).
// If you change the rate on the backend, update it here too so the
// displayed currency value matches what withdrawals actually pay out.
export const COIN_TO_CASH_RATE = 0.004;

export function coinsToCurrency(coins) {
  const amount = (Number(coins) || 0) * COIN_TO_CASH_RATE;
  return `₹${amount.toFixed(2)}`;
}
