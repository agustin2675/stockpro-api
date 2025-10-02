import { Injectable } from '@nestjs/common';
import { CreateUnidadesMedidaDto } from './dto/create-unidades-medida.dto';
import { UpdateUnidadesMedidaDto } from './dto/update-unidades-medida.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UnidadesMedidaService {

  constructor(private prismaService:PrismaService){

  }
  async create(createUnidadesMedidaDto: CreateUnidadesMedidaDto) {
    return await this.prismaService.unidadDeMedida.create({
      data: {
        nombre: createUnidadesMedidaDto.nombre
      }
    })
  }

  findAll() {
    return this.prismaService.unidadDeMedida.findMany({
      where: {
        activo: true
      }
    })
  }

  findOne(id: number) {
    return this.prismaService.unidadDeMedida.findUnique({
      where: {
        id: id,
        activo: true
      }
    })
  }

  update(id: number, updateUnidadesMedidaDto: UpdateUnidadesMedidaDto) {
    return this.prismaService.unidadDeMedida.update({
      where: {
        id: id
      },
      data: {
        nombre: updateUnidadesMedidaDto.nombre
      }
    })
  }

  remove(id: number) {
    return this.prismaService.unidadDeMedida.update({
      where: {
        id: id
      },
      data: {
        activo: false
      }
    });
  }
}
