import Link from "next/link";
import {
    HEATMAP_WIDGET_CONFIG,
    MARKET_DATA_WIDGET_CONFIG,
    MARKET_OVERVIEW_WIDGET_CONFIG,
    TOP_STORIES_WIDGET_CONFIG
} from "@/lib/constants";
import TradingViewWidget from "@/components/TradingViewWidget";
import { getWatchlistWithData } from "@/lib/actions/watchlist.actions";

const Home = async () => {
    const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;
    const watchlist = await getWatchlistWithData();
    const topWatchlist = watchlist.slice(0, 4);

    return (
        <div className="flex min-h-screen home-wrapper">
            {topWatchlist.length > 0 && (
                <section className="grid w-full grid-cols-2 gap-4 lg:grid-cols-4">
                    {topWatchlist.map((item) => (
                        <Link
                            key={item.symbol}
                            href={`/stocks/${item.symbol}`}
                            className="flex flex-col gap-1 rounded-lg border border-gray-700 bg-gray-800 p-4 transition-colors hover:border-yellow-500"
                        >
                            <span className="text-sm text-gray-500">{item.symbol}</span>
                            <span className="text-lg font-semibold text-gray-100">{item.priceFormatted ?? '—'}</span>
                            <span
                                className={`text-sm ${
                                    item.changePercent === undefined
                                        ? 'text-gray-500'
                                        : item.changePercent >= 0
                                          ? 'text-green-500'
                                          : 'text-red-500'
                                }`}
                            >
                                {item.changeFormatted ?? '—'}
                            </span>
                        </Link>
                    ))}
                </section>
            )}

            <section className="grid w-full gap-8 home-section">
                <div className="md:col-span-1 xl:col-span-1">
                    <TradingViewWidget
                        title="Market Overview"
                        scriptUrl={`${scriptUrl}market-overview.js`}
                        config={MARKET_OVERVIEW_WIDGET_CONFIG}
                        className="custom-chart"
                        height={600}
                    />
                </div>
                <div className="md:col-span-1 xl:col-span-2">
                    <TradingViewWidget
                        title="Stock Heatmap"
                        scriptUrl={`${scriptUrl}stock-heatmap.js`}
                        config={HEATMAP_WIDGET_CONFIG}
                        height={600}
                    />
                </div>
            </section>

            <section className="grid w-full gap-8 home-section">
                <div className="h-full md:col-span-1 xl:col-span-1">
                    <TradingViewWidget
                        title="Top Stories"
                        scriptUrl={`${scriptUrl}timeline.js`}
                        config={TOP_STORIES_WIDGET_CONFIG}
                        className="custom-chart"
                        height={600}
                    />
                </div>
                <div className="h-full md:col-span-1 xl:col-span-2">
                    <TradingViewWidget
                        title="Market Quotes"
                        scriptUrl={`${scriptUrl}market-quotes.js`}
                        config={MARKET_DATA_WIDGET_CONFIG}
                        height={600}
                    />
                </div>
            </section>
        </div>
    );
};

export default Home;
