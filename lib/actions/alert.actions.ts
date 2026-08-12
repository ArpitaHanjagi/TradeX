'use server';

import { connectToDatabase } from "@/DATABASE/mongoose";
import { AlertModel } from "@/lib/models/alert.model";
import { getCurrentUser } from "@/lib/better-auth/session";
import { getQuote } from "@/lib/actions/finnhub.actions";
import { isAlertTriggered } from "@/lib/alert-utils";

export const getAlerts = async (): Promise<Alert[]> => {
    const user = await getCurrentUser();
    if (!user) return [];

    await connectToDatabase();
    const docs = await AlertModel.find({ userId: user.id }).sort({ createdAt: -1 }).lean();

    return Promise.all(
        docs.map(async (doc) => {
            const quote = await getQuote(doc.symbol);
            return {
                id: doc._id.toString(),
                symbol: doc.symbol,
                company: doc.company,
                alertName: doc.alertName,
                currentPrice: quote?.c ?? 0,
                alertType: doc.alertType,
                threshold: doc.threshold,
                changePercent: quote?.dp,
            } satisfies Alert;
        })
    );
};

// Lightweight, user-scoped, read-only check used to power the in-app
// toast/sound notification while the user has the app open. This never
// deletes alerts or sends email — that stays the Inngest cron's job — so
// the two can run at different cadences without racing each other.
export const checkTriggeredAlerts = async (): Promise<Alert[]> => {
    const user = await getCurrentUser();
    if (!user) return [];

    await connectToDatabase();
    const docs = await AlertModel.find({ userId: user.id }).lean();

    const triggered: Alert[] = [];

    for (const doc of docs) {
        const quote = await getQuote(doc.symbol);
        if (quote?.c === undefined) continue;

        if (isAlertTriggered(doc.alertType, doc.threshold, quote.c)) {
            triggered.push({
                id: doc._id.toString(),
                symbol: doc.symbol,
                company: doc.company,
                alertName: doc.alertName,
                currentPrice: quote.c,
                alertType: doc.alertType,
                threshold: doc.threshold,
                changePercent: quote.dp,
            });
        }
    }

    return triggered;
};

const parseThreshold = (value: string) => {
    const threshold = Number(value);
    if (!Number.isFinite(threshold) || threshold <= 0) return null;
    return threshold;
};

export const createAlert = async (data: AlertData) => {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'You must be signed in to create alerts' };

    if (!data.alertName.trim()) return { success: false, error: 'Alert name is required' };

    const threshold = parseThreshold(data.threshold);
    if (threshold === null) return { success: false, error: 'Enter a valid threshold price' };

    try {
        await connectToDatabase();
        await AlertModel.create({
            userId: user.id,
            symbol: data.symbol.toUpperCase(),
            company: data.company,
            alertName: data.alertName.trim(),
            alertType: data.alertType,
            threshold,
        });
        return { success: true };
    } catch (e) {
        console.error('Failed to create alert', e);
        return { success: false, error: 'Failed to create alert' };
    }
};

export const updateAlert = async (alertId: string, data: AlertData) => {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'You must be signed in to update alerts' };

    if (!data.alertName.trim()) return { success: false, error: 'Alert name is required' };

    const threshold = parseThreshold(data.threshold);
    if (threshold === null) return { success: false, error: 'Enter a valid threshold price' };

    try {
        await connectToDatabase();
        const result = await AlertModel.updateOne(
            { _id: alertId, userId: user.id },
            { alertName: data.alertName.trim(), alertType: data.alertType, threshold }
        );
        if (result.matchedCount === 0) return { success: false, error: 'Alert not found' };
        return { success: true };
    } catch (e) {
        console.error('Failed to update alert', e);
        return { success: false, error: 'Failed to update alert' };
    }
};

export const deleteAlert = async (alertId: string) => {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'You must be signed in to delete alerts' };

    try {
        await connectToDatabase();
        await AlertModel.deleteOne({ _id: alertId, userId: user.id });
        return { success: true };
    } catch (e) {
        console.error('Failed to delete alert', e);
        return { success: false, error: 'Failed to delete alert' };
    }
};
