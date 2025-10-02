import { Module } from '@nestjs/common';
import { TipoStocksService } from './tipo-stocks.service';
import { TipoStocksController } from './tipo-stocks.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [TipoStocksController],
  providers: [TipoStocksService,PrismaService],
})
export class TipoStocksModule {}
