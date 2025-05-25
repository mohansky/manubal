// src/lib/auth-client.ts
import { createAuthClient } from "better-auth/client";

// Simple solution: Use current origin in browser, fallback for SSR
const baseURL = typeof window !== 'undefined' 
  ? window.location.origin 
  : 'https://manubal.netlify.app';

console.log('Auth URL:', baseURL);

export const authClient = createAuthClient({
  baseURL,
});

export const { signIn, signUp, signOut, updateUser, useSession } = authClient;
