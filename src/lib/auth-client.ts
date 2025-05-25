// src/lib/auth-client.ts
import { createAuthClient } from "better-auth/client";

// Hardcoded production URL - will work 100%
const baseURL = 'https://manubal.netlify.app';

console.log('Auth client baseURL (hardcoded):', baseURL);

export const authClient = createAuthClient({
  baseURL,
});

export const { signIn, signUp, signOut, updateUser, useSession } = authClient;
