import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateInsumoDto } from './dto/create-insumo.dto';
import { UpdateInsumoDto } from './dto/update-insumo.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddToSucursalDto } from './dto/add-to-sucursal.dto';

@Injectable()
export class InsumosService {

  constructor(private prismaService: PrismaService){

  }

  async create(createInsumoDto: CreateInsumoDto) {
    const {nombre, unidadDeMedida_id, rubro_id} = createInsumoDto
    return await this.prismaService.insumo.create({
      data: {
        nombre: nombre,
        unidadDeMedida_id: unidadDeMedida_id,
        rubro_id: rubro_id,
        activo: true
      }
    })
  }

  findAll() {
    return this.prismaService.insumo.findMany({
      where:{
        activo: true
      }
    })
  }

  findOne(id: number) {
    return this.prismaService.insumo.findUnique({
      where:{
        id:id,
        activo: true
      }
    })
  }

  update(id: number, updateInsumoDto: UpdateInsumoDto) {
    const {nombre, unidadDeMedida_id, rubro_id} = updateInsumoDto
    return this.prismaService.insumo.update({
      where:{
        id: id
      },
      data: {
        nombre: nombre,
        unidadDeMedida_id,
        rubro_id
      }
    })
  }

  remove(id: number) {
    return this.prismaService.insumo.update({
      where: {
        id: id
      },
      data: {
        activo: false
      }
    })
  }

  // --- CREATE ---
  addToSucursal(dto: AddToSucursalDto) {
    const { sucursal_id, insumo_id, tipoStock_id, cantidadReal, cantidadIdeal, cantidadMinima } = dto;
    return this.prismaService.sucursalInsumo.create({
      data: { sucursal_id, insumo_id, tipoStock_id, cantidadReal, cantidadIdeal, cantidadMinima },
    });
  }

  // --- LIST ---
  listSucursalInsumo(where?: { sucursal_id?: number; insumo_id?: number; tipoStock_id?: number }) {
    const w: any = {};
    if (where?.sucursal_id !== undefined) w.sucursal_id = Number(where.sucursal_id);
    if (where?.insumo_id !== undefined) w.insumo_id = Number(where.insumo_id);
    if (where?.tipoStock_id !== undefined) w.tipoStock_id = Number(where.tipoStock_id);

    return this.prismaService.sucursalInsumo.findMany({
      where: w,
      orderBy: [{ sucursal_id: 'asc' }, { tipoStock_id: 'asc' }, { insumo_id: 'asc' }],
      include: { insumo: { include: { rubro: true } }, sucursal: true, tipoStock: true },
    });
  }

  // --- GET BY ID ---
  getSucursalInsumoById(id: number) {
    return this.prismaService.sucursalInsumo.findUnique({
      where: { id },
      include: { sucursal: true, insumo: true, tipoStock: true },
    });
  }

  // --- UPDATE ---
  async updateSucursalInsumo(id: number, dto: Partial<AddToSucursalDto>) {
    const exists = await this.prismaService.sucursalInsumo.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('SucursalInsumo no encontrado');

    return this.prismaService.sucursalInsumo.update({
      where: { id },
      data: {
        ...(dto.cantidadMinima  !== undefined ? { cantidadMinima:  dto.cantidadMinima }  : {}),
        ...(dto.cantidadReal  !== undefined ? { cantidadReal:  dto.cantidadReal }  : {}),
        ...(dto.cantidadIdeal !== undefined ? { cantidadIdeal: dto.cantidadIdeal } : {}),
        ...(dto.tipoStock_id  !== undefined ? { tipoStock_id:  dto.tipoStock_id }  : {}),
      },
      include: { sucursal: true, insumo: true, tipoStock: true },
    });
  }

  // --- DELETE ---
  async removeSucursalInsumo(id: number) {
    const exists = await this.prismaService.sucursalInsumo.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('SucursalInsumo no encontrado');
    await this.prismaService.sucursalInsumo.delete({ where: { id } });
    return { ok: true, deletedId: id };
  }

  // --- UPSERT ---
  // Si elegiste la Opción B (único por sucursal+insumo) en schema.prisma:
// --- UPSERT (índice triple) ---
  upsertToSucursal(dto: AddToSucursalDto) {
    const { sucursal_id, tipoStock_id, insumo_id, cantidadReal, cantidadIdeal, cantidadMinima } = dto;

    return this.prismaService.sucursalInsumo.upsert({
      where: {
        // Prisma genera el nombre del unique composite con los campos
        sucursal_id_tipoStock_id_insumo_id: { sucursal_id, tipoStock_id, insumo_id },
      },
      create: { sucursal_id, tipoStock_id, insumo_id, cantidadReal, cantidadIdeal, cantidadMinima },
      update: { cantidadReal, cantidadIdeal, cantidadMinima },
      include: { insumo: { include: { rubro: true } }, sucursal: true, tipoStock: true },
    });
  }


  // Si elegiste la Opción A (único por sucursal+insumo+tipoStock), usa ESTA variante:
  // upsertToSucursal(dto: AddToSucursalDto) {
  //   const { sucursal_id, insumo_id, tipoStock_id, cantidadReal, cantidadIdeal } = dto;
  //   return this.prismaService.sucursalInsumo.upsert({
  //     where: { sucursal_id_insumo_id_tipoStock_id: { sucursal_id, insumo_id, tipoStock_id } }, // @@unique([sucursal_id, insumo_id, tipoStock_id])
  //     create: { sucursal_id, insumo_id, tipoStock_id, cantidadReal, cantidadIdeal },
  //     update: { cantidadReal, cantidadIdeal },
  //     include: { sucursal: true, insumo: true, tipoStock: true },
  //   });
  // }

}
