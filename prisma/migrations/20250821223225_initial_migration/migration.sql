-- CreateEnum
CREATE TYPE "public"."Estado" AS ENUM ('BORRADOR', 'APROBADO', 'ENVIADO_A_PROD');

-- CreateEnum
CREATE TYPE "public"."Rol" AS ENUM ('ADMIN', 'SUCURSAL', 'DESPACHO', 'ENCARGADO_PEDIDO');

-- CreateTable
CREATE TABLE "public"."Insumo" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL,
    "unidadDeMedida_id" INTEGER NOT NULL,
    "rubro_id" INTEGER NOT NULL,

    CONSTRAINT "Insumo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UnidadDeMedida" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "UnidadDeMedida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Rubro" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL,

    CONSTRAINT "Rubro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TipoStock" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL,

    CONSTRAINT "TipoStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Pedido" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "estado" "public"."Estado" NOT NULL,
    "tipoStock_id" INTEGER NOT NULL,
    "sucursal_id" INTEGER NOT NULL,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DetallePedido" (
    "id" SERIAL NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "pedido_id" INTEGER NOT NULL,
    "insumo_id" INTEGER NOT NULL,

    CONSTRAINT "DetallePedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DisponibilidadStockSucursal" (
    "id" SERIAL NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "sucursal_id" INTEGER NOT NULL,
    "tipoStock_id" INTEGER NOT NULL,

    CONSTRAINT "DisponibilidadStockSucursal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Usuario" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL,
    "rol" "public"."Rol" NOT NULL,
    "sucursal_id" INTEGER NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Sucursal" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL,

    CONSTRAINT "Sucursal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SucursalInsumo" (
    "id" SERIAL NOT NULL,
    "cantidadReal" INTEGER NOT NULL,
    "cantidadIdeal" INTEGER NOT NULL,
    "sucursal_id" INTEGER NOT NULL,
    "insumo_id" INTEGER NOT NULL,

    CONSTRAINT "SucursalInsumo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Insumo" ADD CONSTRAINT "Insumo_unidadDeMedida_id_fkey" FOREIGN KEY ("unidadDeMedida_id") REFERENCES "public"."UnidadDeMedida"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Insumo" ADD CONSTRAINT "Insumo_rubro_id_fkey" FOREIGN KEY ("rubro_id") REFERENCES "public"."Rubro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Pedido" ADD CONSTRAINT "Pedido_tipoStock_id_fkey" FOREIGN KEY ("tipoStock_id") REFERENCES "public"."TipoStock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Pedido" ADD CONSTRAINT "Pedido_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "public"."Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DetallePedido" ADD CONSTRAINT "DetallePedido_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "public"."Pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DetallePedido" ADD CONSTRAINT "DetallePedido_insumo_id_fkey" FOREIGN KEY ("insumo_id") REFERENCES "public"."Insumo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DisponibilidadStockSucursal" ADD CONSTRAINT "DisponibilidadStockSucursal_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "public"."Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DisponibilidadStockSucursal" ADD CONSTRAINT "DisponibilidadStockSucursal_tipoStock_id_fkey" FOREIGN KEY ("tipoStock_id") REFERENCES "public"."TipoStock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Usuario" ADD CONSTRAINT "Usuario_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "public"."Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SucursalInsumo" ADD CONSTRAINT "SucursalInsumo_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "public"."Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SucursalInsumo" ADD CONSTRAINT "SucursalInsumo_insumo_id_fkey" FOREIGN KEY ("insumo_id") REFERENCES "public"."Insumo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
