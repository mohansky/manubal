// import { createAuthClient } from "better-auth/client";

// export const authClient = createAuthClient({
//   baseURL: "http://localhost:4321",
// });

// export const { signIn, signUp, signOut, updateUser, useSession } = authClient;


import { createAuthClient } from "better-auth/client";

// Dynamic URL detection for both dev and production
function getAuthURL() {
  // 1. Check for explicit public environment variable
  if (import.meta.env.PUBLIC_BETTER_AUTH_URL) {
    return import.meta.env.PUBLIC_BETTER_AUTH_URL;
  }
  
  // 2. Auto-detect from current window location (works in browser)
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // 3. Fallback to localhost for development
  return 'http://localhost:4321';
}

export const authClient = createAuthClient({
  baseURL: getAuthURL(),
});

export const { signIn, signUp, signOut, updateUser, useSession } = authClient;