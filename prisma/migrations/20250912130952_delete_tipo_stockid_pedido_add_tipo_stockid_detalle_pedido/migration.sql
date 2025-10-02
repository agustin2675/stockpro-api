/*
  Warnings:

  - You are about to drop the column `tipoStock_id` on the `Pedido` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[pedido_id,insumo_id,tipoStock_id]` on the table `DetallePedido` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[fecha,sucursal_id]` on the table `Pedido` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tipoStock_id` to the `DetallePedido` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Pedido" DROP CONSTRAINT "Pedido_tipoStock_id_fkey";

-- DropIndex
DROP INDEX "public"."DetallePedido_pedido_id_insumo_id_key";

-- DropIndex
DROP INDEX "public"."Pedido_fecha_sucursal_id_tipoStock_id_key";

-- AlterTable
ALTER TABLE "public"."DetallePedido" ADD COLUMN     "tipoStock_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."Pedido" DROP COLUMN "tipoStock_id";

-- CreateIndex
CREATE UNIQUE INDEX "DetallePedido_pedido_id_insumo_id_tipoStock_id_key" ON "public"."DetallePedido"("pedido_id", "insumo_id", "tipoStock_id");

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_fecha_sucursal_id_key" ON "public"."Pedido"("fecha", "sucursal_id");

-- AddForeignKey
ALTER TABLE "public"."DetallePedido" ADD CONSTRAINT "DetallePedido_tipoStock_id_fkey" FOREIGN KEY ("tipoStock_id") REFERENCES "public"."TipoStock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
