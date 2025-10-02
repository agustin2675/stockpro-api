import { Module } from '@nestjs/common';
import { SucursalesService } from './sucursales.service';
import { SucursalesController } from './sucursales.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [SucursalesController],
  providers: [SucursalesService, PrismaService],
})
export class SucursalesModule {}
