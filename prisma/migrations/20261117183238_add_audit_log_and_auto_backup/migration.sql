-- CreateTable
CREATE TABLE "AuditLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" INTEGER,
    "description" TEXT,
    "userId" TEXT,
    "userName" TEXT,
    "userEmail" TEXT,
    "ipAddress" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'global',
    "storeName" TEXT NOT NULL DEFAULT 'Salesaty',
    "phone" TEXT NOT NULL DEFAULT '01000000000',
    "phone2" TEXT DEFAULT '01000000000',
    "whatsapp" TEXT NOT NULL DEFAULT '201000000000',
    "address" TEXT NOT NULL DEFAULT 'العنوان هنا',
    "taxNumber" TEXT NOT NULL DEFAULT '123456789',
    "currency" TEXT NOT NULL DEFAULT 'ج.م',
    "defaultTaxRate" REAL NOT NULL DEFAULT 14,
    "defaultDiscount" REAL NOT NULL DEFAULT 0,
    "autoPrintInvoice" BOOLEAN NOT NULL DEFAULT true,
    "enableBarcode" BOOLEAN NOT NULL DEFAULT true,
    "invoicePrefix" TEXT NOT NULL DEFAULT 'INV-',
    "logo" TEXT,
    "footerText" TEXT,
    "autoBackupEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoBackupFrequency" TEXT NOT NULL DEFAULT 'DAILY',
    "lastBackupAt" DATETIME,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Settings" ("address", "autoPrintInvoice", "currency", "defaultDiscount", "defaultTaxRate", "enableBarcode", "footerText", "id", "invoicePrefix", "logo", "phone", "phone2", "storeName", "taxNumber", "updatedAt", "whatsapp") SELECT "address", "autoPrintInvoice", "currency", "defaultDiscount", "defaultTaxRate", "enableBarcode", "footerText", "id", "invoicePrefix", "logo", "phone", "phone2", "storeName", "taxNumber", "updatedAt", "whatsapp" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
