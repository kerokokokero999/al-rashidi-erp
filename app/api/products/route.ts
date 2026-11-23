
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth";
import { logActivity } from "../../../lib/audit";
import { productSchema, formatZodError } from "../../../lib/validations";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const requestedPage = Number.parseInt(searchParams.get("page") || "1", 10);
    const requestedPageSize = Number.parseInt(
      searchParams.get("pageSize") || "20",
      10
    );

    const page = Math.max(
      1,
      Number.isFinite(requestedPage) ? requestedPage : 1
    );

    const allowedPageSizes = [10, 20, 25, 50, 100];
    const pageSize = allowedPageSizes.includes(requestedPageSize)
      ? requestedPageSize
      : 20;

    const search = (searchParams.get("search") || "").trim().slice(0, 100);

    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { barcode: { contains: search } },
            {
              category: {
                is: {
                  name: { contains: search },
                },
              },
            },
          ],
        }
      : {};

    const [products, total, allProducts] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          productUnits: true,
          productStocks: {
            include: { warehouse: true },
          },
          category: true,
          unit: true,
        },
      }),

      prisma.product.count({ where }),

      prisma.product.findMany({
        select: {
          stock: true,
          costPrice: true,
          minStock: true,
        },
      }),
    ]);

    const totalStockValue = allProducts.reduce(
      (sum, product) => sum + product.stock * product.costPrice,
      0
    );

    const lowStockCount = allProducts.filter(
      (product) => product.stock <= product.minStock
    ).length;

    const totalProducts = allProducts.length;
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      data: products,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
      summary: {
        totalProducts,
        totalStockValue,
        lowStockCount,
      },
    });
  } catch (error) {
    console.error("Products GET Error:", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب المنتجات" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "غير مصرح" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const result = productSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: formatZodError(result.error) },
        { status: 400 }
      );
    }

    const data = result.data;

    const newProduct = await prisma.product.create({
      data: {
        name: data.name,
        barcode: data.barcode || null,
        categoryId: data.categoryId || null,
        unitId: data.unitId || null,
        costPrice: data.costPrice,
        sellPrice: data.sellPrice,
        stock: data.stock,
        minStock: data.minStock,
        supplier: data.supplier || null,
        expiryDate: data.expiryDate
          ? new Date(data.expiryDate)
          : null,
        image: data.image || null,

        productStocks: {
          create: data.warehouseStocks.map((ws) => ({
            warehouseId: ws.warehouseId,
            stock: ws.stock,
            purchasePrice: ws.purchasePrice || data.costPrice || 0,
          })),
        },

        productUnits: {
          create: data.productUnits.map((u) => ({
            name: u.name,
            factor: u.factor,
            price: u.price,
            barcode: u.barcode || null,
            isBase: u.isBase,
          })),
        },
      },

      include: {
        productUnits: true,
        productStocks: true,
      },
    });

    await logActivity({
      action: "CREATE",
      entity: "Product",
      entityId: newProduct.id,
      description: `إضافة منتج: ${newProduct.name}`,
      metadata: {
        name: newProduct.name,
        barcode: newProduct.barcode,
        sellPrice: newProduct.sellPrice,
        stock: newProduct.stock,
      },
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Products POST Error:", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء الإضافة" },
      { status: 500 }
    );
  }
}
