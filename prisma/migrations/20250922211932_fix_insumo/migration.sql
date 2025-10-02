-- DropForeignKey
ALTER TABLE "public"."Insumo" DROP CONSTRAINT "Insumo_rubro_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Insumo" DROP CONSTRAINT "Insumo_unidadDeMedida_id_fkey";

-- AlterTable
ALTER TABLE "public"."Insumo" ALTER COLUMN "unidadDeMedida_id" DROP NOT NULL,
ALTER COLUMN "rubro_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Insumo" ADD CONSTRAINT "Insumo_unidadDeMedida_id_fkey" FOREIGN KEY ("unidadDeMedida_id") REFERENCES "public"."UnidadDeMedida"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Insumo" ADD CONSTRAINT "Insumo_rubro_id_fkey" FOREIGN KEY ("rubro_id") REFERENCES "public"."Rubro"("id") ON DELETE SET NULL ON UPDATE CASCADE;
