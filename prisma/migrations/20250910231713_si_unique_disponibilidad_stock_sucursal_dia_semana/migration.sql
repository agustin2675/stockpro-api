/*
  Warnings:

  - A unique constraint covering the columns `[sucursal_id,tipoStock_id,diaSemana]` on the table `DisponibilidadStockSucursal` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."DisponibilidadStockSucursal_sucursal_id_tipoStock_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "DisponibilidadStockSucursal_sucursal_id_tipoStock_id_diaSem_key" ON "public"."DisponibilidadStockSucursal"("sucursal_id", "tipoStock_id", "diaSemana");
