import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      role?: string;
      permissions?: string;
      branchId?: number; // ← ضيف دي
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role?: string;
    permissions?: string;
    branchId?: number; // ← ضيف دي
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    permissions?: string;
    branchId?: number; // ← ضيف دي
  }
}