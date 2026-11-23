import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth";
import fs from "fs";
import path from "path";

// ✅ قفل عام لمنع التزامن (race condition)
let isSyncingOrders = false;
let isSyncingProducts = false;

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      console.error("Missing Supabase env vars");
      return NextResponse.json({ error: "مفاتيح Supabase غير موجودة" }, { status: 500 });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const body = await request.json();
    const { type } = body;

    // دالة مساعدة لرفع الصورة لـ Supabase Storage
    async function uploadImageToSupabase(localImagePath: string): Promise<string | null> {
      try {
        if (!localImagePath) return null;
        if (localImagePath.startsWith("http")) return localImagePath;

        const filePath = path.join(process.cwd(), "public", localImagePath);
        if (!fs.existsSync(filePath)) {
          console.error(`File not found: ${filePath}`);
          return null;
        }

        const fileBuffer = fs.readFileSync(filePath);
        const fileName = `${Date.now()}-${path.basename(localImagePath)}`;

        const { error } = await supabase.storage
          .from("product-images")
          .upload(fileName, fileBuffer, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (error) {
          console.error("Image upload error:", error);
          return null;
        }

        const { data: publicUrlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);

        return publicUrlData.publicUrl;
      } catch (error) {
        console.error("Error uploading image:", error);
        return null;
      }
    }

    if (type === "products") {
      // ✅ منع التزامن
      if (isSyncingProducts) {
        return NextResponse.json({ message: "المزامنة شغالة بالفعل", skipped: true });
      }
      isSyncingProducts = true;

      try {
        const products = await prisma.product.findMany({
          include: { category: true, unit: true },
        });
        let successCount = 0;
        const errors: string[] = [];

        for (const product of products) {
          try {
            let publicImageUrl = product.image;
            if (product.image && !product.image.startsWith("http")) {
              const uploadedUrl = await uploadImageToSupabase(product.image);
              if (uploadedUrl) publicImageUrl = uploadedUrl;
            }

            const { error } = await supabase.from("OnlineProducts").upsert({
              localId: product.id,
              name: product.name,
              category: product.category?.name || "",
              sellPrice: product.sellPrice,
              stock: product.stock,
              image: publicImageUrl,
              updatedAt: new Date(),
            }, { onConflict: "localId" });

            if (error) {
              errors.push(`منتج ${product.name}: ${error.message}`);
            } else {
              successCount++;
            }
          } catch (err) {
            console.error("Error syncing product:", product.name, err);
            errors.push(`منتج ${product.name}: خطأ في الرفع`);
          }
        }

        const { data: onlineProducts } = await supabase
          .from("OnlineProducts")
          .select("localId");

        let deletedCount = 0;
        if (onlineProducts) {
          const localIds = products.map((p) => p.id);
          const toDelete = onlineProducts
            .filter((op) => !localIds.includes(op.localId))
            .map((op) => op.localId);

          if (toDelete.length > 0) {
            const { error: deleteError } = await supabase
              .from("OnlineProducts")
              .delete()
              .in("localId", toDelete);

            if (deleteError) {
              console.error("Delete error:", deleteError);
              errors.push(`حذف المنتجات: ${deleteError.message}`);
            } else {
              deletedCount = toDelete.length;
            }
          }
        }

        const settings = await prisma.settings.findUnique({ where: { id: "global" } });
        if (settings) {
          const { error: settingsError } = await supabase.from("OnlineSettings").upsert({
            id: "global",
            storeName: settings.storeName,
            whatsapp: settings.whatsapp,
            phone: settings.phone,
            address: settings.address,
          });
          if (settingsError) {
            console.error("Settings upsert error:", settingsError);
            errors.push(`إعدادات: ${settingsError.message}`);
          }
        }

        return NextResponse.json({
          message: `تمت مزامنة ${successCount} من ${products.length} منتج، وحذف ${deletedCount} منتج`,
          errors: errors.length > 0 ? errors : undefined,
        });
      } finally {
        isSyncingProducts = false;
      }
    }

    if (type === "orders") {
      // ✅ منع التزامن — الحل الأساسي للمشكلة
      if (isSyncingOrders) {
        console.log("⚠️ Sync already running, skipping...");
        return NextResponse.json({ message: "المزامنة شغالة بالفعل", skipped: true });
      }
      isSyncingOrders = true;

      try {
        const { data: newOrders, error } = await supabase
          .from("OnlineOrders")
          .select("*")
          .eq("syncedToLocal", false)
          .order("id", { ascending: true });

        if (error) {
          console.error("Fetch orders error:", error);
          return NextResponse.json({ error: `خطأ في جلب الطلبات: ${error.message}` }, { status: 500 });
        }

        if (newOrders && newOrders.length > 0) {
          let successCount = 0;
          let skippedCount = 0;

          for (const order of newOrders) {
            try {
              // ✅ تحقق بـ onlineOrderId
              const existingOrder = await prisma.order.findFirst({
                where: { onlineOrderId: order.id },
              });

              if (existingOrder) {
                console.log(`Order ${order.id} already exists locally, skipping...`);
                await supabase
                  .from("OnlineOrders")
                  .update({ syncedToLocal: true })
                  .eq("id", order.id);
                skippedCount++;
                continue;
              }

              // إنشاء الطلب
              const localOrder = await prisma.order.create({
                data: {
                  onlineOrderId: order.id,
                  customerName: order.customerName,
                  customerPhone: order.customerPhone,
                  customerAddress: order.customerAddress,
                  items: JSON.stringify(order.items),
                  total: order.total,
                  status: order.status,
                },
              });

              // إنشاء الإشعار
              await prisma.notification.create({
                data: {
                  title: "طلب أونلاين جديد 🛒",
                  message: `طلب جديد من ${order.customerName} بقيمة ${order.total} ج.م`,
                  type: "ORDER",
                  link: `/orders/${localOrder.id}`,
                },
              });

              // تحديث Supabase
              await supabase
                .from("OnlineOrders")
                .update({ syncedToLocal: true })
                .eq("id", order.id);

              successCount++;
            } catch (err) {
              console.error("Error syncing order:", order.id, err);
            }
          }

          return NextResponse.json({
            message: `تم سحب ${successCount} طلب جديد، وتخطي ${skippedCount} طلب مكرر`,
            count: successCount,
            skipped: skippedCount,
          });
        }

        return NextResponse.json({ message: "مفيش طلبات جديدة", count: 0 });
      } finally {
        isSyncingOrders = false;
      }
    }

    return NextResponse.json({ error: "نوع المزامنة غير معروف" }, { status: 400 });
  } catch (error) {
    console.error("Sync Error:", error);
    return NextResponse.json({ error: `حدث خطأ: ${error}` }, { status: 500 });
  }
}