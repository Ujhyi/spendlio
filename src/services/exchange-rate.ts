const SUPPORTED_CURRENCIES = ['EUR', 'CZK', 'USD', 'GBP', 'PLN'] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

const rateCache = new Map<string, { rate: number; fetchedAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export function isSupportedCurrency(value: string): value is Currency {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}

async function getRate(from: Currency, to: Currency): Promise<number> {
  if (from === to) return 1;

  const key = `${from}_${to}`;
  const cached = rateCache.get(key);
  const now = Date.now();

  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.rate;
  }

  const response = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
  const data = await response.json();
  const rate = data.rates[to];
  rateCache.set(key, { rate, fetchedAt: now });
  return rate;
}

export async function convertAmount(amount: number, from: Currency, to: Currency): Promise<number> {
  const rate = await getRate(from, to);
  return Math.round(amount * rate * 100) / 100;
}