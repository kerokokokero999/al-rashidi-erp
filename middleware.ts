import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// الصفحات اللي مش محتاجة صلاحية
const PUBLIC_PATHS = ["/login", "/unauthorized", "/login-test", "/help"];

// خريطة المسارات للصلاحيات المطلوبة
const PATH_PERMISSIONS: Record<string, string[]> = {
  "/admin": ["/admin"],
  "/pos": ["/pos"],
  "/products": ["/products"],
  "/invoices": ["/invoices"],
  "/purchases": ["/purchases"],
  "/suppliers": ["/suppliers"],
  "/customers": ["/customers"],
  "/employees": ["/employees"],
  "/returns": ["/returns"],
  "/returns-log": ["/returns-log", "/returns"],
  "/expenses": ["/expenses"],
  "/treasury": ["/treasury"],
  "/vouchers": ["/vouchers"],
  "/reports": ["/reports"],
  "/tax": ["/tax"],
  "/settings": ["/settings"],
  "/users": ["/users"],
  "/audit-log": ["/audit-log"],
  "/backup": ["/backup"],
  "/hr": ["/hr"],
  "/orders": ["/orders"],
  "/notifications": ["/notifications"],
  "/branches": ["/branches"],
  "/warehouses": ["/warehouses"],
  "/audits": ["/audits"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. الصفحات العامة — مسموح
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // 2. جلب التوكن
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // 3. لو مش مسجل دخول → Login
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. الأدمن — كل حاجة مسموحة
  const role = (token as { role?: string }).role;
  if (role === "ADMIN") {
    return NextResponse.next();
  }

  // 5. جلب صلاحيات المستخدم
  let permissions: string[] = [];
  try {
    const permsStr = (token as { permissions?: string }).permissions;
    if (permsStr) {
      permissions = JSON.parse(permsStr);
    }
  } catch {
    permissions = [];
  }

  // 6. لو مفيش صلاحيات خالص → Unauthorized
  if (permissions.length === 0) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  // 7. تحديد الصلاحية المطلوبة للمسار الحالي
  const requiredPermissions = Object.entries(PATH_PERMISSIONS).find(([path]) =>
    pathname === path || pathname.startsWith(path + "/")
  )?.[1];

  // 8. لو المسار مش في الخريطة → مسموح (زي الصفحات الرئيسية)
  if (!requiredPermissions) {
    return NextResponse.next();
  }

  // 9. التحقق: هل المستخدم عنده أي صلاحية من المطلوب؟
  const hasPermission = requiredPermissions.some((required) =>
    permissions.some((perm) => {
      // مطابقة مباشرة
      if (perm === required) return true;
      // صلاحية أعم (زي /products بيسمح لـ /products/add)
      if (required.startsWith(perm + "/")) return true;
      // صلاحية أخص (زي /purchases/manage بيسمح لـ /purchases)
      if (perm.startsWith(required + "/")) return true;
      return false;
    })
  );

  if (!hasPermission) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files (images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};