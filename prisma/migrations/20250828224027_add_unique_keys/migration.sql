/*
  Warnings:

  - A unique constraint covering the columns `[pedido_id,insumo_id]` on the table `DetallePedido` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sucursal_id,tipoStock_id]` on the table `DisponibilidadStockSucursal` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[fecha,sucursal_id,tipoStock_id]` on the table `Pedido` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "DetallePedido_pedido_id_insumo_id_key" ON "public"."DetallePedido"("pedido_id", "insumo_id");

-- CreateIndex
CREATE UNIQUE INDEX "DisponibilidadStockSucursal_sucursal_id_tipoStock_id_key" ON "public"."DisponibilidadStockSucursal"("sucursal_id", "tipoStock_id");

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_fecha_sucursal_id_tipoStock_id_key" ON "public"."Pedido"("fecha", "sucursal_id", "tipoStock_id");
