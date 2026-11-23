import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const resolvedParams = await params;
    const order = await prisma.order.findUnique({
      where: { id: Number(resolvedParams.id) },
    });

    if (!order) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Get order error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const resolvedParams = await params;
    const body = await request.json();
    const { status } = body;

    const validStatuses = ["PENDING", "PREPARING", "DELIVERED", "CANCELLED"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: "حالة غير صالحة" }, { status: 400 });
    }

    // 1. تحديث في SQLite
    const order = await prisma.order.update({
      where: { id: Number(resolvedParams.id) },
      data: { status },
    });

    // 2. تحديث في Supabase (لو الطلب مربوط)
    if (order.onlineOrderId) {
      try {
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
          console.error("Missing Supabase env vars");
        } else {
          const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
          );

          const { error } = await supabase
            .from("OnlineOrders")
            .update({ status })
            .eq("id", order.onlineOrderId);

          if (error) {
            console.error("Error updating Supabase:", error);
          } else {
            console.log(`✅ Updated Supabase order ${order.onlineOrderId} to ${status}`);
          }
        }
      } catch (err) {
        console.error("Error connecting to Supabase:", err);
      }
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const resolvedParams = await params;

    // 1. جلب الطلب عشان نعرف onlineOrderId
    const order = await prisma.order.findUnique({
      where: { id: Number(resolvedParams.id) },
    });

    // 2. حذف من SQLite
    await prisma.order.delete({
      where: { id: Number(resolvedParams.id) },
    });

    // 3. حذف من Supabase (لو مربوط)
    if (order?.onlineOrderId) {
      try {
        if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
          const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
          );
          await supabase
            .from("OnlineOrders")
            .delete()
            .eq("id", order.onlineOrderId);
        }
      } catch (err) {
        console.error("Error deleting from Supabase:", err);
      }
    }

    return NextResponse.json({ message: "تم حذف الطلب" });
  } catch (error) {
    console.error("Delete order error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}