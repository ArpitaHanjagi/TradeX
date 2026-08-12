import nodemailer from "nodemailer";
import { formatINR } from "@/lib/currency";

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
    },
});

const wrapEmail = (title: string, bodyHtml: string) => `
<div style="font-family: Arial, sans-serif; background-color: #0f0f0f; padding: 32px 16px;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #141414; border-radius: 12px; padding: 32px; color: #dbdbdb;">
    <h1 style="color: #FDD458; font-size: 20px; margin: 0 0 16px 0;">${title}</h1>
    ${bodyHtml}
    <p style="margin-top: 32px; font-size: 12px; color: #6b7280;">Signalist &middot; Track real-time stock prices and market insights</p>
  </div>
</div>`;

export const sendWelcomeEmail = async ({ email, name, intro }: WelcomeEmailData) => {
    const html = wrapEmail(
        `Welcome, ${name}!`,
        `<p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">${intro}</p>
         <p style="margin: 0; font-size: 14px; color: #9ca3af;">You can now search stocks, build your watchlist, and get a daily market news summary in your inbox.</p>`
    );

    console.log(`[nodemailer] sending welcome email to ${email}`);

    try {
        await transporter.sendMail({
            from: `"Signalist" <${process.env.NODEMAILER_EMAIL}>`,
            to: email,
            subject: `Welcome to Signalist, ${name}!`,
            html,
        });
        console.log(`[nodemailer] welcome email sent to ${email}`);
    } catch (e) {
        console.error(`[nodemailer] failed to send welcome email to ${email}`, e);
        throw e;
    }
};

export const sendPriceAlertEmail = async ({
    email,
    name,
    alert,
    currentPrice,
}: {
    email: string;
    name: string;
    alert: { symbol: string; company: string; alertName: string; alertType: 'upper' | 'lower'; threshold: number };
    currentPrice: number;
}) => {
    const direction = alert.alertType === 'upper' ? 'risen above' : 'fallen below';
    const html = wrapEmail(
        'Price Alert Triggered',
        `<p style="margin: 0 0 16px 0; font-size: 14px; color: #9ca3af;">Hi ${name}, your alert "${alert.alertName}" just triggered.</p>
         <p style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">${alert.company} (${alert.symbol})</p>
         <p style="margin: 0; font-size: 16px; line-height: 1.6;">Price has ${direction} your threshold of ${formatINR(alert.threshold)} &mdash; currently trading at <strong>${formatINR(currentPrice)}</strong>.</p>`
    );

    console.log(`[nodemailer] sending price alert email to ${email} for ${alert.symbol}`);

    try {
        await transporter.sendMail({
            from: `"Signalist" <${process.env.NODEMAILER_EMAIL}>`,
            to: email,
            subject: `Price Alert: ${alert.symbol} ${alert.alertType === 'upper' ? 'above' : 'below'} ${formatINR(alert.threshold)}`,
            html,
        });
        console.log(`[nodemailer] price alert email sent to ${email}`);
    } catch (e) {
        console.error(`[nodemailer] failed to send price alert email to ${email}`, e);
        throw e;
    }
};

export const sendDailyNewsEmail = async ({
    email,
    name,
    summary,
    newsHtml,
}: {
    email: string;
    name: string;
    summary: string | null;
    newsHtml: string;
}) => {
    const html = wrapEmail(
        'Your Daily Market Summary',
        `<p style="margin: 0 0 16px 0; font-size: 14px; color: #9ca3af;">Hi ${name}, here's what's moving the market today.</p>
         ${summary ? `<p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">${summary}</p>` : ''}
         ${newsHtml}`
    );

    console.log(`[nodemailer] sending daily news email to ${email}`);

    try {
        await transporter.sendMail({
            from: `"Signalist" <${process.env.NODEMAILER_EMAIL}>`,
            to: email,
            subject: `Your Daily Market Summary - ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
            html,
        });
        console.log(`[nodemailer] daily news email sent to ${email}`);
    } catch (e) {
        console.error(`[nodemailer] failed to send daily news email to ${email}`, e);
        throw e;
    }
};
