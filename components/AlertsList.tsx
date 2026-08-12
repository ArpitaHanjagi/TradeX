'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Pencil, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import AlertModal from '@/components/AlertModal';
import { deleteAlert } from '@/lib/actions/alert.actions';
import { formatINR } from '@/lib/currency';

const AlertsList = ({ alertData }: AlertsListProps) => {
    const router = useRouter();
    const [editing, setEditing] = useState<Alert | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const alerts = alertData ?? [];

    const handleEdit = (alert: Alert) => {
        setEditing(alert);
        setModalOpen(true);
    };

    const handleDelete = async (alert: Alert) => {
        const result = await deleteAlert(alert.id);

        if (!result.success) {
            toast.error(result.error ?? 'Failed to delete alert');
            return;
        }

        toast.success(`Deleted alert "${alert.alertName}"`);
        router.refresh();
    };

    return (
        <div className="watchlist-alerts">
            <h2 className="watchlist-title">Price Alerts</h2>

            <div className="alert-list">
                {alerts.length === 0 ? (
                    <div className="alert-empty">
                        <Bell className="mx-auto mb-2 size-8 text-gray-600" />
                        No price alerts yet. Add one from your watchlist.
                    </div>
                ) : (
                    alerts.map((alert) => (
                        <div key={alert.id} className="alert-item">
                            <p className="alert-name">{alert.alertName}</p>

                            <div className="alert-details">
                                <span className="alert-company">
                                    {alert.company} ({alert.symbol})
                                </span>
                                <span className="alert-price tabular-nums">{formatINR(alert.currentPrice)}</span>
                            </div>

                            <div className="mb-2 flex items-center justify-between text-sm">
                                <span className="flex items-center gap-1 text-gray-500">
                                    {alert.alertType === 'upper' ? (
                                        <ArrowUp className="size-3.5 text-green-500" />
                                    ) : (
                                        <ArrowDown className="size-3.5 text-red-500" />
                                    )}
                                    {alert.alertType === 'upper' ? 'Above' : 'Below'} target
                                </span>
                                <span className="font-medium text-gray-200 tabular-nums">
                                    {formatINR(alert.threshold)}
                                </span>
                            </div>

                            <div className="alert-actions">
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="alert-update-btn"
                                    onClick={() => handleEdit(alert)}
                                    aria-label={`Edit ${alert.alertName}`}
                                >
                                    <Pencil className="size-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="alert-delete-btn"
                                    onClick={() => handleDelete(alert)}
                                    aria-label={`Delete ${alert.alertName}`}
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {editing && (
                <AlertModal
                    alertId={editing.id}
                    action="Edit"
                    open={modalOpen}
                    setOpen={setModalOpen}
                    alertData={{
                        symbol: editing.symbol,
                        company: editing.company,
                        alertName: editing.alertName,
                        alertType: editing.alertType,
                        threshold: String(editing.threshold),
                    }}
                />
            )}
        </div>
    );
};

export default AlertsList;
