/*
  Warnings:

  - You are about to drop the column `tipoStock_id` on the `Rubro` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Rubro" DROP CONSTRAINT "Rubro_tipoStock_id_fkey";

-- AlterTable
ALTER TABLE "public"."Rubro" DROP COLUMN "tipoStock_id";
