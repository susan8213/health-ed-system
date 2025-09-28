import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import type { NextAuthOptions, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 小時後 session 會自動過期
  },
  pages: {
    signIn: '/auth/signin', // 自訂登入頁面
    error: '/auth/error', // 自訂錯誤頁面
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // 限制可登入的帳號清單
      const allowedEmails = process.env.ALLOWED_EMAILS?.split(',') || [];
      
      if (user.email && allowedEmails.includes(user.email)) {
        return true;
      }
      
      return false; // 拒絕登入
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      // 將 Google 帳號資訊加到 session，型別擴充
      if (session.user) {
        // 型別安全地加上 id 屬性
        (session.user as any).id = token.sub;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };