'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { addToWatchlist, removeFromWatchlist } from '@/lib/actions/watchlist.actions';

const WatchlistButton = ({
    symbol,
    company,
    isInWatchlist,
    showTrashIcon = false,
    type = 'button',
    onWatchlistChange,
}: WatchlistButtonProps) => {
    const router = useRouter();
    const [added, setAdded] = useState(isInWatchlist);
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        setLoading(true);
        const result = added ? await removeFromWatchlist(symbol) : await addToWatchlist(symbol, company);
        setLoading(false);

        if (!result.success) {
            toast.error(result.error ?? 'Something went wrong');
            return;
        }

        const nowAdded = !added;
        setAdded(nowAdded);
        onWatchlistChange?.(symbol, nowAdded);
        toast.success(nowAdded ? `Added ${symbol} to watchlist` : `Removed ${symbol} from watchlist`);
        router.refresh();
    };

    if (type === 'icon') {
        return (
            <Button
                variant="ghost"
                size="icon"
                onClick={handleClick}
                disabled={loading}
                className="watchlist-icon-btn"
                aria-label={added ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
            >
                {added && showTrashIcon ? (
                    <Trash2 className="trash-icon" />
                ) : (
                    <Star className={`star-icon ${added ? 'watchlist-icon-added fill-current' : ''}`} />
                )}
            </Button>
        );
    }

    return (
        <Button
            onClick={handleClick}
            disabled={loading}
            className={added ? 'watchlist-btn watchlist-remove' : 'watchlist-btn'}
        >
            {loading ? 'Please wait...' : added ? 'Remove from Watchlist' : 'Add to Watchlist'}
        </Button>
    );
};

export default WatchlistButton;
