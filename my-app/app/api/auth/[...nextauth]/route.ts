import { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
// import { session } from '@/lib/session'   // ⛔️ we'll inline session so we can set user.image

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

const authOption: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.email) throw new Error("No profile");

      // (Optional) store image in DB too:
      await prisma.user.upsert({
        where: { email: profile.email },
        create: {
          email: profile.email,
          name: profile.name,
          image: (profile as any).picture ?? null, // ✅ store if you want
        },
        update: {
          name: profile.name,
          image: (profile as any).picture ?? undefined, // keep fresh
        },
      });
      return true;
    },

    // ✅ Put Google's picture on the JWT
    async jwt({ token, profile }) {
      if (profile) {
        const dbUser = await prisma.user.findUnique({
          where: { email: profile.email as string },
          select: { image: true },
        });
        if (!dbUser) throw new Error("No user found");
        token.id = dbUser.id;
        // Prefer Google picture; fall back to DB image if any
        token.picture = (profile as any).picture ?? dbUser.image ?? token.picture;
      }
      return token;
    },

    // ✅ Expose it on session.user.image
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token as any).id;
        session.user.image = (token as any).picture ?? session.user.image ?? null;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOption);
export { handler as GET, handler as POST };
