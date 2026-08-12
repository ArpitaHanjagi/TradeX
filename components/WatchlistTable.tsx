'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star, Trash2, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import AlertModal from '@/components/AlertModal';
import { removeFromWatchlist } from '@/lib/actions/watchlist.actions';
import { WATCHLIST_TABLE_HEADER } from '@/lib/constants';

const WatchlistTable = ({ watchlist }: WatchlistTableProps) => {
    const [items, setItems] = useState(watchlist);
    const [alertStock, setAlertStock] = useState<StockWithData | null>(null);
    const [alertOpen, setAlertOpen] = useState(false);

    const handleRemove = async (symbol: string) => {
        const result = await removeFromWatchlist(symbol);

        if (!result.success) {
            toast.error(result.error ?? 'Failed to remove from watchlist');
            return;
        }

        setItems((prev) => prev.filter((item) => item.symbol !== symbol));
        toast.success(`Removed ${symbol} from watchlist`);
    };

    const handleAddAlert = (item: StockWithData) => {
        setAlertStock(item);
        setAlertOpen(true);
    };

    if (items.length === 0) {
        return (
            <div className="watchlist-empty-container">
                <div className="watchlist-empty">
                    <Star className="watchlist-star" />
                    <h3 className="empty-title">Your watchlist is empty</h3>
                    <p className="empty-description">
                        Search for stocks and add them to your watchlist to track their prices and set price alerts.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="watchlist-table overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="table-header-row">
                            {WATCHLIST_TABLE_HEADER.map((header) => (
                                <th key={header} className="table-header px-4 py-3 text-sm">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr key={item.symbol} className="table-row">
                                <td className="table-cell px-4 py-3">
                                    <Link href={`/stocks/${item.symbol}`} className="hover:text-yellow-500">
                                        {item.company}
                                    </Link>
                                </td>
                                <td className="table-cell px-4 py-3 text-gray-400">{item.symbol}</td>
                                <td className="table-cell px-4 py-3">{item.priceFormatted ?? '—'}</td>
                                <td
                                    className={`table-cell px-4 py-3 ${
                                        item.changePercent === undefined
                                            ? 'text-gray-400'
                                            : item.changePercent >= 0
                                              ? 'text-green-500'
                                              : 'text-red-500'
                                    }`}
                                >
                                    {item.changeFormatted ?? '—'}
                                </td>
                                <td className="table-cell px-4 py-3 text-gray-400">{item.marketCap ?? '—'}</td>
                                <td className="table-cell px-4 py-3 text-gray-400">{item.peRatio ?? '—'}</td>
                                <td className="table-cell px-4 py-3">
                                    <button className="add-alert" onClick={() => handleAddAlert(item)}>
                                        <Bell className="size-3.5" /> Alert
                                    </button>
                                </td>
                                <td className="table-cell px-4 py-3 text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemove(item.symbol)}
                                        aria-label={`Remove ${item.symbol} from watchlist`}
                                    >
                                        <Trash2 className="trash-icon" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {alertStock && (
                <AlertModal
                    action="Create"
                    open={alertOpen}
                    setOpen={setAlertOpen}
                    alertData={{
                        symbol: alertStock.symbol,
                        company: alertStock.company,
                        alertName: '',
                        alertType: 'upper',
                        threshold: '',
                    }}
                />
            )}
        </>
    );
};

export default WatchlistTable;
