/*
  Warnings:

  - You are about to drop the column `sourceId` on the `Voucher` table. All the data in the column will be lost.
  - You are about to drop the column `sourceType` on the `Voucher` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Voucher" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "voucherNumber" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "partyName" TEXT NOT NULL,
    "reason" TEXT,
    "responsible" TEXT,
    "cashboxId" INTEGER,
    "bankAccountId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Voucher_cashboxId_fkey" FOREIGN KEY ("cashboxId") REFERENCES "Cashbox" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Voucher_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Voucher" ("amount", "createdAt", "id", "partyName", "reason", "responsible", "type", "voucherNumber") SELECT "amount", "createdAt", "id", "partyName", "reason", "responsible", "type", "voucherNumber" FROM "Voucher";
DROP TABLE "Voucher";
ALTER TABLE "new_Voucher" RENAME TO "Voucher";
CREATE UNIQUE INDEX "Voucher_voucherNumber_key" ON "Voucher"("voucherNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
