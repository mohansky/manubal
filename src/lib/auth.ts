import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db"; // Your existing database connection

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite", // Turso uses libSQL which is SQLite compatible
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  advanced: {
    generateId: () => crypto.randomUUID(), // Ensure proper ID generation
  },
});

export type User = typeof auth.$Infer.Session.user;
export type Session = typeof auth.$Infer.Session;