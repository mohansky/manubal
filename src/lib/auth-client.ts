// src/lib/auth-client.ts
import { createAuthClient } from "better-auth/client";

function getAuthURL() {
  // Check if we're in production (Netlify or other production environment)
  if (typeof window !== 'undefined') {
    // In browser - check the current domain
    const isProduction = window.location.hostname !== 'localhost' && 
                        window.location.hostname !== '127.0.0.1';
    
    if (isProduction) {
      // Use current origin for production
      return window.location.origin;
    }
  }
  
  // Check for explicit environment variables
  if (import.meta.env.PUBLIC_BETTER_AUTH_URL) {
    return import.meta.env.PUBLIC_BETTER_AUTH_URL;
  }
  
  if (import.meta.env.BETTER_AUTH_URL) {
    return import.meta.env.BETTER_AUTH_URL;
  }
  
  // Development fallback
  return 'http://localhost:4321';
}

const baseURL = getAuthURL();
console.log('Auth client using URL:', baseURL);

export const authClient = createAuthClient({
  baseURL,
});

export const { signIn, signUp, signOut, updateUser, useSession } = authClient;

export interface UpdateUserData {
  name?: string;
  image?: string;
}

export interface AuthError {
  code?: string;
  message?: string;
}

export interface AuthResponse<T = any> {
  data?: T;
  error?: AuthError | string;
}
