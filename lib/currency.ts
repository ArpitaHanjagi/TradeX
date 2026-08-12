const FRANKFURTER_URL = 'https://api.frankfurter.dev/v1/latest?base=USD&symbols=INR';

// Live USD -> INR rate, revalidated hourly. No API key needed. If the
// request fails we return null rather than guessing a stale/fabricated
// rate — callers must treat a null rate as "conversion unavailable" and
// show a missing-data state instead of a wrong price.
export const getUsdToInrRate = async (): Promise<number | null> => {
    try {
        const res = await fetch(FRANKFURTER_URL, { next: { revalidate: 3600 } });
        if (!res.ok) throw new Error(`Exchange rate request failed: ${res.status}`);

        const data = await res.json();
        const rate = data?.rates?.INR;
        if (typeof rate !== 'number') throw new Error('Malformed exchange rate response');

        return rate;
    } catch (e) {
        console.error('[currency] failed to fetch USD/INR rate', e);
        return null;
    }
};

export const formatINR = (amount?: number): string => {
    if (amount === undefined || Number.isNaN(amount)) return '—';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
    }).format(amount);
};

// Compact Lakh/Crore/Lakh Crore formatting for large values like market
// cap, matching how these numbers are conventionally written in Indian
// financial media (e.g. "₹432 Lakh Cr" for a mega-cap, not an 8-digit
// number followed by "Cr").
export const formatINRCompact = (amount?: number): string => {
    if (amount === undefined || Number.isNaN(amount)) return '—';

    const LAKH = 1_00_000;
    const CRORE = 1_00_00_000;
    const LAKH_CRORE = LAKH * CRORE;

    const abs = Math.abs(amount);

    if (abs >= LAKH_CRORE) {
        return `₹${(amount / LAKH_CRORE).toLocaleString('en-IN', { maximumFractionDigits: 2 })} Lakh Cr`;
    }
    if (abs >= CRORE) {
        return `₹${(amount / CRORE).toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr`;
    }
    if (abs >= LAKH) {
        return `₹${(amount / LAKH).toLocaleString('en-IN', { maximumFractionDigits: 2 })} L`;
    }

    return formatINR(amount);
};
