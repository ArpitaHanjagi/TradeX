const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const generateText = async (prompt: string): Promise<string | null> => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('[gemini] GEMINI_API_KEY is not set, skipping generation');
        return null;
    }

    try {
        const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
            }),
        });

        if (!res.ok) {
            const body = await res.text();
            console.error(`[gemini] request failed: ${res.status} ${res.statusText} - ${body}`);
            return null;
        }

        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        return typeof text === 'string' ? text.trim() : null;
    } catch (e) {
        console.error('[gemini] request threw an error', e);
        return null;
    }
};

export const generateWelcomeIntro = async (data: {
    name: string;
    investmentGoals?: string;
    riskTolerance?: string;
    preferredIndustry?: string;
}): Promise<string> => {
    const prompt = `Write a single warm, concise (max 2 sentences) welcome message for a new user named ${data.name} who just signed up for a stock market tracking app called Signalist. Their investment goal is "${data.investmentGoals ?? 'general investing'}", risk tolerance is "${data.riskTolerance ?? 'unspecified'}", and preferred industry is "${data.preferredIndustry ?? 'unspecified'}". Do not use markdown, just plain text.`;

    const text = await generateText(prompt);
    return text ?? `Welcome to Signalist, ${data.name}! We're excited to help you track the market and stay on top of your investments.`;
};

export const generateNewsSummary = async (headlines: string[]): Promise<string | null> => {
    if (headlines.length === 0) return null;

    const prompt = `Summarize today's top stock market news in 2-3 short sentences for a daily email digest. Do not use markdown. Headlines:\n${headlines.map((h) => `- ${h}`).join('\n')}`;

    return generateText(prompt);
};
