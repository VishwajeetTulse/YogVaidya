"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BASE_URL || window.location.origin // Use current origin if BASE_URL not defined
});

export const { signIn, signOut, useSession } = authClient; 