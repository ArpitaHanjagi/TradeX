import { ObjectId } from "mongodb";
import { inngest } from "@/lib/inngest/client";
import { getDb } from "@/DATABASE/mongodb";
import { connectToDatabase } from "@/DATABASE/mongoose";
import { AlertModel } from "@/lib/models/alert.model";
import { isAlertTriggered } from "@/lib/alert-utils";
import { getMarketNews, getQuote } from "@/lib/actions/finnhub.actions";
import { generateWelcomeIntro, generateNewsSummary } from "@/lib/gemini";
import { sendWelcomeEmail, sendDailyNewsEmail, sendPriceAlertEmail } from "@/lib/nodemailer";
import { NO_MARKET_NEWS } from "@/lib/constants";

const formatNewsHtml = (news: MarketNewsArticle[]) =>
    news
        .slice(0, 8)
        .map(
            (article) => `
      <div style="padding: 12px 0; border-bottom: 1px solid #262626;">
        <a href="${article.url}" style="color: #DBDBDB; font-size: 14px; font-weight: 600; text-decoration: none;">${article.headline}</a>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">${article.source}</p>
      </div>`
        )
        .join('');

export const sendSignUpEmail = inngest.createFunction(
    { id: 'sign-up-email', triggers: { event: 'app/user.created' } },
    async ({ event, step }) => {
        console.log('[inngest] sign-up-email triggered for', event.data.email);

        const intro = await step.run('generate-welcome-intro', async () => {
            return generateWelcomeIntro({
                name: event.data.name,
                investmentGoals: event.data.investmentGoals,
                riskTolerance: event.data.riskTolerance,
                preferredIndustry: event.data.preferredIndustry,
            });
        });

        await step.run('send-welcome-email', async () => {
            await sendWelcomeEmail({ email: event.data.email, name: event.data.name, intro });
        });

        return { success: true };
    }
);

export const sendDailyNewsSummary = inngest.createFunction(
    { id: 'daily-news-summary', triggers: [{ cron: '0 12 * * *' }, { event: 'app/send.daily.news' }] },
    async ({ step }) => {
        const users = await step.run('fetch-users', async () => {
            const db = await getDb();
            const docs = await db
                .collection('user')
                .find({}, { projection: { email: 1, name: 1 } })
                .toArray();
            console.log(`[inngest] fetched ${docs.length} users for daily digest`);
            return docs.map((d) => ({ email: d.email as string, name: d.name as string }));
        });

        if (users.length === 0) {
            console.log('[inngest] no users to notify, skipping');
            return { success: true, usersNotified: 0 };
        }

        const news = await step.run('fetch-market-news', async () => {
            const articles = await getMarketNews();
            console.log(`[inngest] fetched ${articles.length} news articles`);
            return articles;
        });

        const summary = await step.run('generate-news-summary', async () => {
            return generateNewsSummary(news.map((a) => a.headline));
        });

        const newsHtml = news.length > 0 ? formatNewsHtml(news) : NO_MARKET_NEWS;

        const results = await step.run('send-daily-emails', async () => {
            const settled = await Promise.allSettled(
                users.map((user) =>
                    sendDailyNewsEmail({ email: user.email, name: user.name ?? 'Trader', summary, newsHtml })
                )
            );
            const sent = settled.filter((r) => r.status === 'fulfilled').length;
            const failed = settled.filter((r) => r.status === 'rejected').length;
            console.log(`[inngest] daily digest: ${sent} sent, ${failed} failed`);
            return { sent, failed };
        });

        return { success: true, usersNotified: users.length, ...results };
    }
);

export const checkPriceAlerts = inngest.createFunction(
    { id: 'check-price-alerts', triggers: [{ cron: '*/15 * * * *' }, { event: 'app/check.price.alerts' }] },
    async ({ step }) => {
        const triggeredAlerts = await step.run('evaluate-alerts', async () => {
            await connectToDatabase();
            const alerts = await AlertModel.find({}).lean();
            console.log(`[inngest] evaluating ${alerts.length} price alerts`);

            const triggered: {
                id: string;
                userId: string;
                symbol: string;
                company: string;
                alertName: string;
                alertType: 'upper' | 'lower';
                threshold: number;
                currentPrice: number;
            }[] = [];

            for (const alert of alerts) {
                const quote = await getQuote(alert.symbol);
                if (quote?.c === undefined) continue;

                if (isAlertTriggered(alert.alertType, alert.threshold, quote.c)) {
                    triggered.push({
                        id: alert._id.toString(),
                        userId: alert.userId,
                        symbol: alert.symbol,
                        company: alert.company,
                        alertName: alert.alertName,
                        alertType: alert.alertType,
                        threshold: alert.threshold,
                        currentPrice: quote.c,
                    });
                }
            }

            return triggered;
        });

        if (triggeredAlerts.length === 0) {
            console.log('[inngest] no price alerts triggered');
            return { success: true, triggered: 0, sent: 0 };
        }

        const sentCount = await step.run('notify-and-clear-alerts', async () => {
            const db = await getDb();
            let sent = 0;

            for (const alert of triggeredAlerts) {
                const user = await db.collection('user').findOne({ _id: new ObjectId(alert.userId) });
                if (!user?.email) continue;

                try {
                    await sendPriceAlertEmail({
                        email: user.email,
                        name: user.name ?? 'Trader',
                        alert,
                        currentPrice: alert.currentPrice,
                    });
                    // One-shot alert: remove it once triggered so the user isn't
                    // spammed every 15 minutes while the price stays past threshold.
                    await AlertModel.deleteOne({ _id: alert.id });
                    sent++;
                } catch (e) {
                    console.error(`[inngest] failed to notify for alert ${alert.id}`, e);
                }
            }

            console.log(`[inngest] price alerts: ${triggeredAlerts.length} triggered, ${sent} emails sent`);
            return sent;
        });

        return { success: true, triggered: triggeredAlerts.length, sent: sentCount };
    }
);
