import { Injectable } from '@nestjs/common';
import { CreateRubroDto } from './dto/create-rubro.dto';
import { UpdateRubroDto } from './dto/update-rubro.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RubrosService {

  constructor(private prismaSevice: PrismaService){

  }
  create(createRubroDto: CreateRubroDto) {
    const {nombre} = createRubroDto

    return this.prismaSevice.rubro.create({
      data: {
        nombre: nombre,
        activo: true
      }
    })
  }

  findAll() {
    return this.prismaSevice.rubro.findMany({
      where:{
        activo: true
      }
    });
  }

  findOne(id: number) {
    return this.prismaSevice.rubro.findUnique({
      where:{
        id: id,
        activo: true
      }
    });
  }

  update(id: number, updateRubroDto: UpdateRubroDto) {
    const {nombre} = updateRubroDto
    return this.prismaSevice.rubro.update({
      where: {
        id: id
      },
      data: {
        nombre: nombre,
      }
    })
  }

  remove(id: number) {
    return this.prismaSevice.rubro.update({
      where: {
        id: id
      },
      data: {
        activo: false
      }
    })
  }
}
