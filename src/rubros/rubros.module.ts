import { Module } from '@nestjs/common';
import { RubrosService } from './rubros.service';
import { RubrosController } from './rubros.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [RubrosController],
  providers: [RubrosService, PrismaService],
})
export class RubrosModule {}
