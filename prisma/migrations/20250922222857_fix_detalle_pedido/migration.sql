-- DropForeignKey
ALTER TABLE "public"."DetallePedido" DROP CONSTRAINT "DetallePedido_pedido_id_fkey";

-- AddForeignKey
ALTER TABLE "public"."DetallePedido" ADD CONSTRAINT "DetallePedido_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "public"."Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;
