'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { checkTriggeredAlerts } from '@/lib/actions/alert.actions';
import { playAlertSound } from '@/lib/notification-sound';
import { formatINR } from '@/lib/currency';

// Polling interval for the in-app "did an alert just trigger" check. The
// Inngest cron (every 15 min) remains the source of truth for emailing and
// deleting triggered alerts — this only adds an instant sound/toast while
// the user has the app open, so it can afford to be more frequent without
// duplicating that job.
const POLL_INTERVAL_MS = 60_000;

const AlertNotifier = () => {
    // Persists across client-side navigations within (root) since this
    // component's parent layout doesn't remount between pages, so an alert
    // is never announced twice in the same browser session.
    const notifiedIds = useRef<Set<string>>(new Set());

    useEffect(() => {
        let cancelled = false;

        const check = async () => {
            try {
                const triggered = await checkTriggeredAlerts();
                if (cancelled) return;

                for (const alert of triggered) {
                    if (notifiedIds.current.has(alert.id)) continue;
                    notifiedIds.current.add(alert.id);

                    playAlertSound();
                    toast.success(
                        `${alert.symbol} ${alert.alertType === 'upper' ? 'rose above' : 'fell below'} ${formatINR(alert.threshold)}`,
                        {
                            description: `${alert.alertName} · now trading at ${formatINR(alert.currentPrice)}`,
                            duration: 10000,
                        }
                    );
                }
            } catch (e) {
                console.error('Failed to check price alerts', e);
            }
        };

        check();
        const interval = setInterval(check, POLL_INTERVAL_MS);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, []);

    return null;
};

export default AlertNotifier;
