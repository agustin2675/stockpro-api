import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InsumosModule } from './insumos/insumos.module';
import { PrismaService } from './prisma/prisma.service';
import { TipoStocksModule } from './tipo-stocks/tipo-stocks.module';
import { SucursalesModule } from './sucursales/sucursales.module';
import { UnidadesMedidaModule } from './unidades-medida/unidades-medida.module';
import { RubrosModule } from './rubros/rubros.module';
import { PedidosModule } from './pedidos/pedidos.module';

@Module({
  imports: [InsumosModule, TipoStocksModule, SucursalesModule, UnidadesMedidaModule, RubrosModule, PedidosModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
