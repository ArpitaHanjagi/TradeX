import { Newspaper } from "lucide-react";
import { NO_MARKET_NEWS } from "@/lib/constants";
import NewsImage from "@/components/NewsImage";

const formatDate = (unixSeconds: number) =>
    new Date(unixSeconds * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });

// Finnhub often reuses a wire-service's logo as the "image" for every one of
// its articles instead of a real photo. A URL that repeats across multiple
// articles in the same batch is almost certainly one of those generic
// logos, so we treat it as "no real image" and fall back to our own card.
const countImageOccurrences = (news: MarketNewsArticle[]) => {
    const counts = new Map<string, number>();
    for (const article of news) {
        if (article.image) counts.set(article.image, (counts.get(article.image) ?? 0) + 1);
    }
    return counts;
};

const NewsList = ({ news = [] }: WatchlistNewsProps) => {
    if (news.length === 0) {
        return <div dangerouslySetInnerHTML={{ __html: NO_MARKET_NEWS }} />;
    }

    const imageCounts = countImageOccurrences(news);

    return (
        <div className="watchlist-news">
            {news.map((article) => {
                const isGenericImage = !!article.image && (imageCounts.get(article.image) ?? 0) > 1;
                const hasImage = !!article.image && !isGenericImage;

                return (
                    <a
                        key={article.id}
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="news-item flex flex-col gap-3"
                    >
                        <NewsImage src={article.image} alt={article.headline} showFallback={isGenericImage} />

                        {article.related && <span className="news-tag">{article.related}</span>}

                        <div className="news-meta flex items-center gap-1.5">
                            {!hasImage && <Newspaper className="size-3.5 shrink-0 text-gray-600" />}
                            {article.source} · {formatDate(article.datetime)}
                        </div>
                        <h3 className="news-title">{article.headline}</h3>
                        {article.summary && <p className="news-summary">{article.summary}</p>}
                        <span className="news-cta">Read full article &rarr;</span>
                    </a>
                );
            })}
        </div>
    );
};

export default NewsList;
