import WatchlistTable from "@/components/WatchlistTable";
import AlertsList from "@/components/AlertsList";
import { getWatchlistWithData } from "@/lib/actions/watchlist.actions";
import { getAlerts } from "@/lib/actions/alert.actions";

const WatchlistPage = async () => {
    const [watchlist, alerts] = await Promise.all([getWatchlistWithData(), getAlerts()]);

    return (
        <div className="watchlist-container">
            <section className="watchlist">
                <h1 className="watchlist-title">Watchlist</h1>
                <WatchlistTable watchlist={watchlist} />
            </section>

            <AlertsList alertData={alerts} />
        </div>
    );
};

export default WatchlistPage;
