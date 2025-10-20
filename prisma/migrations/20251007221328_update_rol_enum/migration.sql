/*
  Warnings:

  - The values [DESPACHO,ENCARGADO_PEDIDO] on the enum `Rol` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."Rol_new" AS ENUM ('ADMIN', 'SUCURSAL', 'ENCARGADO');
ALTER TABLE "public"."Usuario" ALTER COLUMN "rol" TYPE "public"."Rol_new" USING ("rol"::text::"public"."Rol_new");
ALTER TYPE "public"."Rol" RENAME TO "Rol_old";
ALTER TYPE "public"."Rol_new" RENAME TO "Rol";
DROP TYPE "public"."Rol_old";
COMMIT;
