/*
  Warnings:

  - A unique constraint covering the columns `[onlineOrderId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN "onlineOrderId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Order_onlineOrderId_key" ON "Order"("onlineOrderId");
