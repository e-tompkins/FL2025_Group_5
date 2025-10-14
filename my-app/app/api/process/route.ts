import { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    // Ensure user exists (don’t drop image here unless your schema has it)
    async signIn({ profile }) {
      if (!profile?.email) return false;

      await prisma.user.upsert({
        where: { email: profile.email },
        create: {
          email: profile.email,
          name: profile.name,
          // If your Prisma schema includes an `image` field and you want to store it:
          // image: (profile as any).picture ?? null,
        },
        update: {
          name: profile.name,
          // image: (profile as any).picture ?? null,
        },
      });
      return true;
    },

    // Put the Google avatar onto the JWT
    async jwt({ token, profile }) {
      if (profile && (profile as any).picture) {
        token.picture = (profile as any).picture; // e.g., https://lh3.googleusercontent.com/...
      }
      // If you want the DB to be authoritative for id/picture, you can also fetch:
      // if (token.email) {
      //   const dbUser = await prisma.user.findUnique({ where: { email: token.email as string }, select: { id: true, image: true }});
      //   if (dbUser?.id) token.id = dbUser.id;
      //   if (dbUser?.image) token.picture = dbUser.image;
      // }
      return token;
    },

    // Expose the avatar on the client session
    async session({ session, token }) {
      if (session.user) {
        if (token?.id) (session.user as any).id = token.id;
        if (token?.picture) session.user.image = token.picture as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
