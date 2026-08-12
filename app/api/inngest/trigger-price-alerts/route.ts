import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";

/**
 * Dev-only helper to manually fire the price alert check without waiting
 * for the 15-minute cron. Visit /api/inngest/trigger-price-alerts while
 * `npm run dev` and `npx inngest-cli@latest dev` are both running.
 */
export async function GET() {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    await inngest.send({ name: 'app/check.price.alerts', data: {} });

    return NextResponse.json({ success: true, message: 'Price alert check event sent. Check the Inngest dev dashboard for progress.' });
}
