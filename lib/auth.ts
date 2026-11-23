import { getServerSession } from "next-auth";
import { authOptions } from "../app/api/auth/[...nextauth]/route";

// دالة بترجع بيانات المستخدم الحالي وصلاحيته
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}