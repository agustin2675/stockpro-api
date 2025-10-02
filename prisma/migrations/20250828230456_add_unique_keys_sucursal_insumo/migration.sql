/*
  Warnings:

  - A unique constraint covering the columns `[sucursal_id,insumo_id]` on the table `SucursalInsumo` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SucursalInsumo_sucursal_id_insumo_id_key" ON "public"."SucursalInsumo"("sucursal_id", "insumo_id");
