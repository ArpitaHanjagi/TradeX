'use server';

import { headers } from "next/headers";
import { auth } from "@/lib/better-auth/auth";
import { inngest } from "@/lib/inngest/client";

export const signUpWithEmail = async (data: SignUpFormData) => {
    try {
        const response = await auth.api.signUpEmail({
            body: {
                email: data.email,
                password: data.password,
                name: data.fullName,
                country: data.country,
                investmentGoals: data.investmentGoals,
                riskTolerance: data.riskTolerance,
                preferredIndustry: data.preferredIndustry,
            },
            headers: await headers(),
        });

        if (response) {
            await inngest.send({
                name: 'app/user.created',
                data: {
                    email: data.email,
                    name: data.fullName,
                    country: data.country,
                    investmentGoals: data.investmentGoals,
                    riskTolerance: data.riskTolerance,
                    preferredIndustry: data.preferredIndustry,
                },
            });
        }

        return { success: true };
    } catch (e) {
        console.error('Sign up failed', e);
        return { success: false, error: e instanceof Error ? e.message : 'Sign up failed' };
    }
};

export const signInWithEmail = async (data: SignInFormData) => {
    try {
        await auth.api.signInEmail({
            body: {
                email: data.email,
                password: data.password,
            },
            headers: await headers(),
        });

        return { success: true };
    } catch (e) {
        console.error('Sign in failed', e);
        return { success: false, error: e instanceof Error ? e.message : 'Invalid email or password' };
    }
};

export const signOutUser = async () => {
    try {
        await auth.api.signOut({ headers: await headers() });
        return { success: true };
    } catch (e) {
        console.error('Sign out failed', e);
        return { success: false, error: e instanceof Error ? e.message : 'Sign out failed' };
    }
};
