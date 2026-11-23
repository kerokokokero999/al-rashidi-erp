import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    // تأمين: لازم يكون مسجل دخول
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "لم يتم اختيار صورة" }, { status: 400 });
    }

    // تحويل الملف لـ Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // تجهيز اسم فريد للصورة عشان ميتعارضش مع صور تانية
    const timestamp = Date.now();
    const extension = path.extname(file.name) || ".jpg";
    const fileName = `product-${timestamp}${extension}`;

    // مسار الحفظ (فولدر public/uploads)
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    
    // لو الفولدر مش موجود، نعمله
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // حفظ الملف
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);

    // إرجاع الرابط اللي هيتحفظ في الداتابيز
    const imageUrl = `/uploads/${fileName}`;

    return NextResponse.json({ url: imageUrl }, { status: 200 });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء رفع الصورة" }, { status: 500 });
  }
}