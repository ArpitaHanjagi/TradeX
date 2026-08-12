'use server';

import { POPULAR_STOCK_NAMES } from "@/lib/constants";
import { getWatchlistSymbols } from "@/lib/actions/watchlist.actions";
import { getUsdToInrRate } from "@/lib/currency";

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

const finnhubFetch = async (path: string, revalidateSeconds: number) => {
    const token = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!token) throw new Error('NEXT_PUBLIC_FINNHUB_API_KEY must be set within .env');

    const separator = path.includes('?') ? '&' : '?';
    const res = await fetch(`${FINNHUB_BASE_URL}${path}${separator}token=${token}`, {
        next: { revalidate: revalidateSeconds },
    });

    if (!res.ok) {
        throw new Error(`Finnhub request failed: ${res.status} ${res.statusText}`);
    }

    return res.json();
};

// Finnhub quotes are always in the stock's listing currency (USD for the
// US-listed symbols this app supports). Every price field here is
// converted to INR using a live exchange rate so the rest of the app can
// just format and display these numbers directly. `dp` (percent change)
// is left as-is since it's a ratio, not a currency value, and is
// unaffected by the conversion.
export const getQuote = async (symbol: string): Promise<QuoteData | null> => {
    try {
        const [usdQuote, rate] = await Promise.all([
            finnhubFetch(`/quote?symbol=${encodeURIComponent(symbol)}`, 30),
            getUsdToInrRate(),
        ]);

        if (rate === null) {
            console.error(`Skipping quote for ${symbol}: USD/INR rate unavailable`);
            return null;
        }

        const toInr = (value?: number) => (value === undefined ? undefined : value * rate);

        return {
            c: toInr(usdQuote.c),
            d: toInr(usdQuote.d),
            dp: usdQuote.dp,
            h: toInr(usdQuote.h),
            l: toInr(usdQuote.l),
            o: toInr(usdQuote.o),
            pc: toInr(usdQuote.pc),
        };
    } catch (e) {
        console.error(`Failed to fetch quote for ${symbol}`, e);
        return null;
    }
};

const DEFAULT_STOCKS: Stock[] = Object.keys(POPULAR_STOCK_NAMES).map((symbol) => ({
    symbol,
    name: POPULAR_STOCK_NAMES[symbol],
    exchange: 'US',
    type: 'Common Stock',
}));

export const searchStocks = async (query?: string): Promise<StockWithWatchlistStatus[]> => {
    const trimmed = query?.trim();
    const watchlistSymbols = await getWatchlistSymbols();

    let stocks: Stock[];

    if (!trimmed) {
        stocks = DEFAULT_STOCKS;
    } else {
        // Errors are intentionally left to propagate here so the search UI
        // can distinguish "no results" from "the request failed".
        const data: FinnhubSearchResponse = await finnhubFetch(`/search?q=${encodeURIComponent(trimmed)}`, 300);
        stocks = (data.result ?? [])
            .filter((r) => r.type === 'Common Stock')
            .slice(0, 15)
            .map((r) => ({
                symbol: r.displaySymbol ?? r.symbol,
                name: r.description,
                exchange: 'US',
                type: r.type,
            }));
    }

    return stocks.map((stock) => ({
        ...stock,
        isInWatchlist: watchlistSymbols.includes(stock.symbol.toUpperCase()),
    }));
};

export const getCompanyProfile = async (symbol: string): Promise<ProfileData | null> => {
    try {
        const [profile, rate] = await Promise.all([
            finnhubFetch(`/stock/profile2?symbol=${encodeURIComponent(symbol)}`, 3600),
            getUsdToInrRate(),
        ]);
        if (!profile || !profile.name) return null;

        // Finnhub returns marketCapitalization in millions of USD. Convert
        // it to a raw INR value so callers can pass it straight to
        // formatINRCompact without needing the exchange rate themselves.
        const marketCapitalization =
            rate !== null && typeof profile.marketCapitalization === 'number'
                ? profile.marketCapitalization * 1_000_000 * rate
                : undefined;

        return { ...profile, marketCapitalization };
    } catch (e) {
        console.error(`Failed to fetch company profile for ${symbol}`, e);
        return null;
    }
};

export const getBasicFinancials = async (symbol: string): Promise<FinancialsData | null> => {
    try {
        const data = await finnhubFetch(`/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all`, 3600);
        return { metric: data?.metric ?? {} };
    } catch (e) {
        console.error(`Failed to fetch financials for ${symbol}`, e);
        return null;
    }
};

export const getMarketNews = async (): Promise<MarketNewsArticle[]> => {
    try {
        const articles: RawNewsArticle[] = await finnhubFetch('/news?category=general', 900);

        return articles
            .filter((a) => a.headline && a.url)
            .slice(0, 20)
            .map((a) => ({
                id: a.id,
                headline: a.headline!,
                summary: a.summary ?? '',
                source: a.source ?? 'Unknown',
                url: a.url!,
                datetime: a.datetime ?? 0,
                category: a.category ?? 'general',
                related: a.related ?? '',
                image: a.image,
            }));
    } catch (e) {
        console.error('Failed to fetch market news', e);
        return [];
    }
};
