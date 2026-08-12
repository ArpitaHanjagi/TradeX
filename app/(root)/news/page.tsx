import NewsList from "@/components/NewsList";
import { getMarketNews } from "@/lib/actions/finnhub.actions";

const NewsPage = async () => {
    const news = await getMarketNews();

    return (
        <div className="flex flex-col gap-6">
            <h1 className="watchlist-title">Market News</h1>
            <NewsList news={news} />
        </div>
    );
};

export default NewsPage;
