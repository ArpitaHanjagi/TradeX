'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import WatchlistButton from '@/components/WatchlistButton';
import AlertModal from '@/components/AlertModal';

const StockActions = ({ symbol, company, isInWatchlist }: { symbol: string; company: string; isInWatchlist: boolean }) => {
    const [alertOpen, setAlertOpen] = useState(false);

    return (
        <div className="flex flex-wrap items-center gap-3">
            <WatchlistButton symbol={symbol} company={company} isInWatchlist={isInWatchlist} />
            <button className="add-alert" onClick={() => setAlertOpen(true)}>
                <Bell className="size-4" /> Add Alert
            </button>

            <AlertModal
                action="Create"
                open={alertOpen}
                setOpen={setAlertOpen}
                alertData={{ symbol, company, alertName: '', alertType: 'upper', threshold: '' }}
            />
        </div>
    );
};

export default StockActions;
