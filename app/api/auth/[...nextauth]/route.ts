import NextAuth, { User, Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("البريد الإلكتروني وكلمة المرور مطلوبان");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("المستخدم غير موجود");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("كلمة المرور غير صحيحة");
        }

        // ← ضفنا branchId هنا
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: user.permissions,
          branchId: user.branchId,
        } as User & { role: string; permissions?: string; branchId?: number };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }: { 
      token: JWT; 
      user?: User & { role?: string; permissions?: string; branchId?: number }; 
      trigger?: "signIn" | "signUp" | "update"; 
      session?: { permissions?: string; branchId?: number } 
    }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.permissions = user.permissions;
        token.branchId = user.branchId; // ← ضيف دي
      }
      if (trigger === "update" && session?.permissions) {
        token.permissions = session.permissions;
        token.branchId = session.branchId;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        (session.user as { permissions?: string }).permissions = token.permissions as string;
        (session.user as { branchId?: number }).branchId = token.branchId as number; // ← ضيف دي
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt" as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };