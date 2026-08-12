import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";

/**
 * Dev-only helper to manually fire the daily news summary without waiting
 * for the cron schedule. Visit /api/inngest/trigger-daily-news while
 * `npm run dev` and `npx inngest-cli@latest dev` are both running.
 */
export async function GET() {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    await inngest.send({ name: 'app/send.daily.news', data: {} });

    return NextResponse.json({ success: true, message: 'Daily news summary event sent. Check the Inngest dev dashboard for progress.' });
}
