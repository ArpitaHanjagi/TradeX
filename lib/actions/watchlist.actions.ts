'use server';

import { connectToDatabase } from "@/DATABASE/mongoose";
import { Watchlist } from "@/lib/models/watchlist.model";
import { getCurrentUser } from "@/lib/better-auth/session";
import { getQuote, getCompanyProfile, getBasicFinancials } from "@/lib/actions/finnhub.actions";
import { formatINR, formatINRCompact } from "@/lib/currency";

export const getWatchlistSymbols = async (): Promise<string[]> => {
    const user = await getCurrentUser();
    if (!user) return [];

    await connectToDatabase();
    const items = await Watchlist.find({ userId: user.id }, { symbol: 1 }).lean();
    return items.map((item) => item.symbol);
};

export const getWatchlistWithData = async (): Promise<StockWithData[]> => {
    const user = await getCurrentUser();
    if (!user) return [];

    await connectToDatabase();
    const items = await Watchlist.find({ userId: user.id }).sort({ addedAt: -1 }).lean();

    const withData = await Promise.all(
        items.map(async (item) => {
            const [quote, profile, financials] = await Promise.all([
                getQuote(item.symbol),
                getCompanyProfile(item.symbol),
                getBasicFinancials(item.symbol),
            ]);
            const peTTM = financials?.metric?.peTTM;

            return {
                userId: item.userId,
                symbol: item.symbol,
                company: item.company,
                addedAt: item.addedAt,
                currentPrice: quote?.c,
                changePercent: quote?.dp,
                priceFormatted: quote?.c !== undefined ? formatINR(quote.c) : undefined,
                changeFormatted: quote?.dp ? `${quote.dp > 0 ? '+' : ''}${quote.dp.toFixed(2)}%` : undefined,
                marketCap: formatINRCompact(profile?.marketCapitalization),
                peRatio: peTTM ? peTTM.toFixed(2) : undefined,
            } satisfies StockWithData;
        })
    );

    return withData;
};

export const addToWatchlist = async (symbol: string, company: string) => {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'You must be signed in to use the watchlist' };

    try {
        await connectToDatabase();
        await Watchlist.updateOne(
            { userId: user.id, symbol: symbol.toUpperCase() },
            { $setOnInsert: { userId: user.id, symbol: symbol.toUpperCase(), company, addedAt: new Date() } },
            { upsert: true }
        );
        return { success: true };
    } catch (e) {
        console.error('Failed to add to watchlist', e);
        return { success: false, error: 'Failed to add to watchlist' };
    }
};

export const removeFromWatchlist = async (symbol: string) => {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'You must be signed in to use the watchlist' };

    try {
        await connectToDatabase();
        await Watchlist.deleteOne({ userId: user.id, symbol: symbol.toUpperCase() });
        return { success: true };
    } catch (e) {
        console.error('Failed to remove from watchlist', e);
        return { success: false, error: 'Failed to remove from watchlist' };
    }
};
