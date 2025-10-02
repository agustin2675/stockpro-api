import { Module } from '@nestjs/common';
import { UnidadesMedidaService } from './unidades-medida.service';
import { UnidadesMedidaController } from './unidades-medida.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [UnidadesMedidaController],
  providers: [UnidadesMedidaService, PrismaService],
})
export class UnidadesMedidaModule {}
