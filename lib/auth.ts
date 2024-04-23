import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { NextAuthOptions, getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { env } from "@/lib/env";

import { db } from "./db";

import type { Adapter } from "next-auth/adapters";

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db) as Adapter,
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
  ],
};

export function getServerAuthSession() {
  return getServerSession(authOptions);
}
