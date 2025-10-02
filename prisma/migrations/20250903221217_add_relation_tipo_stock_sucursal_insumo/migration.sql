/*
  Warnings:

  - Added the required column `tipoStock_id` to the `SucursalInsumo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."SucursalInsumo" ADD COLUMN     "tipoStock_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."SucursalInsumo" ADD CONSTRAINT "SucursalInsumo_tipoStock_id_fkey" FOREIGN KEY ("tipoStock_id") REFERENCES "public"."TipoStock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
