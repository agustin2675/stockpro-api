/*
  Warnings:

  - Added the required column `tipoStock_id` to the `Rubro` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Rubro" ADD COLUMN     "tipoStock_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."UnidadDeMedida" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true;

-- AddForeignKey
ALTER TABLE "public"."Rubro" ADD CONSTRAINT "Rubro_tipoStock_id_fkey" FOREIGN KEY ("tipoStock_id") REFERENCES "public"."TipoStock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
