import { Injectable } from '@nestjs/common';
import { CreateTipoStockDto } from './dto/create-tipo-stock.dto';
import { UpdateTipoStockDto } from './dto/update-tipo-stock.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TipoStocksService {

  constructor(private prismaService : PrismaService){}

  async create(createTipoStockDto: CreateTipoStockDto) {
    const {nombre} = createTipoStockDto;
    const newTipoStock = await this.prismaService.tipoStock.create({
      data:{
        nombre: nombre,
        activo: true
      }
    })
    return newTipoStock;
  }

  findAll() {
    return this.prismaService.tipoStock.findMany({
      where:{
        activo:true
      }
    }
    );
  }

  findOne(id: number) {
    return this.prismaService.tipoStock.findUnique({
      where:{
        id:id
      }
    });
  }

  update(id: number, updateTipoStockDto: UpdateTipoStockDto) {
    const {nombre} = updateTipoStockDto;
    return this.prismaService.tipoStock.update({
      where:{
        id
      },
      data:{
        nombre
      }
    });
  }

  remove(id: number) {
    return this.prismaService.tipoStock.update({
      where:{
        id
      },
      data:{
        activo: false
      }
    });
  }
}
