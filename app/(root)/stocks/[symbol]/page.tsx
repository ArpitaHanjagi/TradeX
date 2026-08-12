import { notFound } from "next/navigation";
import Image from "next/image";
import TradingViewWidget from "@/components/TradingViewWidget";
import StockActions from "@/components/StockActions";
import { getCompanyProfile, getQuote } from "@/lib/actions/finnhub.actions";
import { getWatchlistSymbols } from "@/lib/actions/watchlist.actions";
import { formatINR, formatINRCompact } from "@/lib/currency";
import {
    CANDLE_CHART_WIDGET_CONFIG,
    BASELINE_WIDGET_CONFIG,
    TECHNICAL_ANALYSIS_WIDGET_CONFIG,
    SYMBOL_INFO_WIDGET_CONFIG,
    COMPANY_PROFILE_WIDGET_CONFIG,
    COMPANY_FINANCIALS_WIDGET_CONFIG,
} from "@/lib/constants";

const SCRIPT_URL = 'https://s3.tradingview.com/external-embedding/embed-widget-';

const StockDetailsPage = async ({ params }: StockDetailsPageProps) => {
    const { symbol: rawSymbol } = await params;
    const symbol = rawSymbol.toUpperCase();

    const [profile, quote, watchlistSymbols] = await Promise.all([
        getCompanyProfile(symbol),
        getQuote(symbol),
        getWatchlistSymbols(),
    ]);

    if (!profile) notFound();

    const isInWatchlist = watchlistSymbols.includes(symbol);
    const isUp = (quote?.dp ?? 0) >= 0;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                    {profile.logo && (
                        <Image
                            src={profile.logo}
                            alt={`${profile.name} logo`}
                            width={56}
                            height={56}
                            className="rounded-lg bg-gray-800"
                            unoptimized
                        />
                    )}
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-100">
                            {profile.name} <span className="text-gray-500">({symbol})</span>
                        </h1>
                        <p className="text-sm text-gray-500">
                            {[profile.exchange, profile.finnhubIndustry].filter(Boolean).join(' · ')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {quote?.c !== undefined && (
                        <div className="text-right">
                            <div className="text-2xl font-semibold text-gray-100">{formatINR(quote.c)}</div>
                            {quote.dp !== undefined && (
                                <div className={isUp ? 'text-green-500' : 'text-red-500'}>
                                    {isUp ? '+' : ''}
                                    {quote.dp.toFixed(2)}%
                                </div>
                            )}
                            {profile.marketCapitalization !== undefined && (
                                <div className="text-xs text-gray-500">
                                    Mkt Cap {formatINRCompact(profile.marketCapitalization)}
                                </div>
                            )}
                        </div>
                    )}
                    <StockActions symbol={symbol} company={profile.name ?? symbol} isInWatchlist={isInWatchlist} />
                </div>
            </div>

            <div className="stock-details-container grid">
                <div className="flex flex-col gap-6 xl:col-span-2">
                    <TradingViewWidget
                        title="Price Chart"
                        scriptUrl={`${SCRIPT_URL}advanced-chart.js`}
                        config={CANDLE_CHART_WIDGET_CONFIG(symbol)}
                        className="custom-chart"
                        height={600}
                    />
                    <TradingViewWidget
                        title="Baseline Chart"
                        scriptUrl={`${SCRIPT_URL}advanced-chart.js`}
                        config={BASELINE_WIDGET_CONFIG(symbol)}
                        className="custom-chart"
                        height={400}
                    />
                    <TradingViewWidget
                        title="Technical Analysis"
                        scriptUrl={`${SCRIPT_URL}technical-analysis.js`}
                        config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(symbol)}
                        height={400}
                    />
                </div>

                <div className="flex flex-col gap-6">
                    <TradingViewWidget
                        scriptUrl={`${SCRIPT_URL}symbol-info.js`}
                        config={SYMBOL_INFO_WIDGET_CONFIG(symbol)}
                        height={170}
                    />
                    <TradingViewWidget
                        title="Company Profile"
                        scriptUrl={`${SCRIPT_URL}symbol-profile.js`}
                        config={COMPANY_PROFILE_WIDGET_CONFIG(symbol)}
                        height={440}
                    />
                    <TradingViewWidget
                        title="Financials"
                        scriptUrl={`${SCRIPT_URL}financials.js`}
                        config={COMPANY_FINANCIALS_WIDGET_CONFIG(symbol)}
                        height={464}
                    />
                </div>
            </div>
        </div>
    );
};

export default StockDetailsPage;
