import { z } from "zod";

// ===== Product =====
export const productSchema = z.object({
  name: z.string().min(2, "اسم المنتج يجب أن يكون حرفين على الأقل").max(100, "اسم المنتج طويل جداً"),
  barcode: z.string().optional().nullable(),
  categoryId: z.coerce.number().int().positive().optional().nullable(),
  unitId: z.coerce.number().int().positive().optional().nullable(),
  costPrice: z.coerce.number().min(0, "سعر الشراء لا يمكن أن يكون سالباً"),
  sellPrice: z.coerce.number().min(0, "سعر البيع لا يمكن أن يكون سالباً"),
  stock: z.coerce.number().int().min(0, "الكمية لا يمكن أن تكون سالبة"),
  minStock: z.coerce.number().int().min(0).default(5),
  supplier: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  warehouseStocks: z.array(z.object({
    warehouseId: z.coerce.number().int().positive(),
    stock: z.coerce.number().min(0),
    purchasePrice: z.coerce.number().min(0).optional(),
  })).optional().default([]),
  productUnits: z.array(z.object({
    name: z.string().min(1, "اسم الوحدة مطلوب"),
    factor: z.coerce.number().positive("المعامل يجب أن يكون أكبر من صفر"),
    price: z.coerce.number().min(0, "السعر لا يمكن أن يكون سالباً"),
    barcode: z.string().optional().nullable(),
    isBase: z.boolean().optional().default(false),
  })).optional().default([]),
});

// ===== Invoice =====
export const invoiceSchema = z.object({
  items: z.array(z.object({
    productId: z.coerce.number().int().positive(),
    name: z.string().min(1),
    quantity: z.coerce.number().positive("الكمية يجب أن تكون أكبر من صفر"),
    sellPrice: z.coerce.number().min(0, "السعر لا يمكن أن يكون سالباً"),
    unitId: z.coerce.number().int().positive().optional().nullable(),
    unitName: z.string().optional().nullable(),
    factor: z.coerce.number().positive().default(1),
  })).min(1, "الفاتورة يجب أن تحتوي على منتج واحد على الأقل"),
  subTotal: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).default(0),
  tax: z.coerce.number().min(0).default(0),
  total: z.coerce.number().min(0),
  paymentMethod: z.enum(["CASH", "CREDIT"]).default("CASH"),
  paidAmount: z.coerce.number().min(0).default(0),
  dueDate: z.string().optional().nullable(),
  customerId: z.coerce.number().int().positive().optional().nullable(),
  warehouseId: z.coerce.number().int().positive().optional().nullable(),
  cashboxId: z.coerce.number().int().positive().optional().nullable(),
});

// ===== Purchase =====
export const purchaseSchema = z.object({
  items: z.array(z.object({
    productId: z.coerce.number().int().positive(),
    warehouseId: z.coerce.number().int().positive(),
    name: z.string().min(1),
    quantity: z.coerce.number().positive("الكمية يجب أن تكون أكبر من صفر"),
    unitId: z.coerce.number().int().positive().optional().nullable(),
    unitName: z.string().optional().nullable(),
    factor: z.coerce.number().positive().default(1),
    costPrice: z.coerce.number().min(0, "سعر الشراء لا يمكن أن يكون سالباً"),
    tax: z.coerce.number().min(0).default(0),
    discount: z.coerce.number().min(0).default(0),
    total: z.coerce.number().min(0),
  })).min(1, "الفاتورة يجب أن تحتوي على منتج واحد على الأقل"),
  total: z.coerce.number().min(0),
  supplierId: z.coerce.number().int().positive().optional().nullable(),
  status: z.enum(["PENDING", "RECEIVED", "CANCELLED"]).default("PENDING"),
  paymentMethod: z.enum(["CASH", "CREDIT"]).default("CASH"),
  paidAmount: z.coerce.number().min(0).default(0),
  dueDate: z.string().optional().nullable(),
  cashboxId: z.coerce.number().int().positive().optional().nullable(),
});

// ===== Payment =====
export const paymentSchema = z.object({
  type: z.enum(["SUPPLIER", "CUSTOMER"]),
  supplierId: z.coerce.number().int().positive().optional().nullable(),
  customerId: z.coerce.number().int().positive().optional().nullable(),
  purchaseId: z.coerce.number().int().positive().optional().nullable(),
  invoiceId: z.coerce.number().int().positive().optional().nullable(),
  amount: z.coerce.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
  paymentMethod: z.enum(["CASH", "CARD", "BANK"]).default("CASH"),
  notes: z.string().optional().nullable(),
  cashboxId: z.coerce.number().int().positive().optional().nullable(),
});

// ===== Expense =====
export const expenseSchema = z.object({
  title: z.string().min(2, "اسم المصروف مطلوب"),
  amount: z.coerce.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
  cashboxId: z.coerce.number().int().positive().optional().nullable(),
});

// ===== Voucher =====
export const voucherSchema = z.object({
  type: z.enum(["RECEIPT", "PAYMENT"]),
  amount: z.coerce.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
  partyName: z.string().min(2, "اسم الجهة مطلوب"),
  reason: z.string().optional().nullable(),
  responsible: z.string().optional().nullable(),
  cashboxId: z.coerce.number().int().positive().optional().nullable(),
  bankAccountId: z.coerce.number().int().positive().optional().nullable(),
});

// ===== Customer =====
export const customerSchema = z.object({
  name: z.string().min(2, "اسم العميل مطلوب").max(100),
  phone: z.string().min(10, "رقم التليفون غير صحيح").max(20),
  email: z.string().email("البريد الإلكتروني غير صحيح").optional().nullable().or(z.literal("")),
});

// ===== Supplier =====
export const supplierSchema = z.object({
  name: z.string().min(2, "اسم المورد مطلوب").max(100),
  phone: z.string().min(10, "رقم التليفون غير صحيح").max(20),
  email: z.string().email("البريد الإلكتروني غير صحيح").optional().nullable().or(z.literal("")),
});

// ===== Helper: تحويل أخطاء Zod لرسالة عربية =====
export function formatZodError(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join(" | ");
}