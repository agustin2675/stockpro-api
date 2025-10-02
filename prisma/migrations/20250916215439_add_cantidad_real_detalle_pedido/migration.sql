/*
  Warnings:

  - You are about to drop the column `cantidad` on the `DetallePedido` table. All the data in the column will be lost.
  - Added the required column `cantidadPedido` to the `DetallePedido` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cantidadReal` to the `DetallePedido` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."DetallePedido" DROP COLUMN "cantidad",
ADD COLUMN     "cantidadPedido" INTEGER NOT NULL,
ADD COLUMN     "cantidadReal" INTEGER NOT NULL;
