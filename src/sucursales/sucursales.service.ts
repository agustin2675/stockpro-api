import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSucursaleDto } from './dto/create-sucursale.dto';
import { UpdateSucursaleDto } from './dto/update-sucursale.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddDisponibilidadStockSucursalDto } from './dto/add-disponibilidad-stock-sucursal.dto';
import { UpdateDisponibilidadStockSucursalDto } from './dto/update-disponibilidad.dto';

@Injectable()
export class SucursalesService {

  constructor(private prismaService:PrismaService){

  }
  async create(createSucursaleDto: CreateSucursaleDto) {
    const {nombre, direccion, telefono} = createSucursaleDto
    const newSucursal = await this.prismaService.sucursal.create({
      data: {
        nombre,
        direccion,
        telefono,
        activo: true
      }
    })
  }

  findAll() {
    return this.prismaService.sucursal.findMany({
      where: {
        activo: true
      }
    });
  }

  findOne(id: number) {
    return this.prismaService.sucursal.findUnique({
      where: {
        id: id,
        activo: true
      }
    });
  }

  update(id: number, updateSucursaleDto: UpdateSucursaleDto) {
    const {nombre, direccion, telefono} = updateSucursaleDto
    return this.prismaService.sucursal.update({
      where: {
        id
      },
      data: {
        nombre,
        direccion,
        telefono
      }
    })
  }

  remove(id: number) {
    return this.prismaService.sucursal.update({
      where: {
        id
      },
      data: {
        activo: false
      }
    })
  }

async addDisponibilidad(addDisponibilidadDto: AddDisponibilidadStockSucursalDto) {
  const { sucursal_id, tipoStock_id, diaSemana } = addDisponibilidadDto;
  
  // Aseguramos números (por si vienen como string del body)
  const sucursalId = Number(sucursal_id);
  const tipoStockId = Number(tipoStock_id);
  const dia = typeof diaSemana === 'number' ? diaSemana : Number(diaSemana);
  const diaFinal = Number.isFinite(dia) ? dia : 1; // default = 1

  // Versión simple: create
  return await this.prismaService.disponibilidadStockSucursal.create({
    data: {
      sucursal_id: sucursalId,
      tipoStock_id: tipoStockId,
      diaSemana: diaFinal,
    },
  });
}

  
  // =========== LISTAR (con filtros opcionales) ===========
  async listDisponibilidad(params?: { sucursal_id?: number; tipoStock_id?: number }) {
    const where: any = {
          tipoStock: { activo: true }, // ✅ solo tipoStock activos
    };
    if (params?.sucursal_id) where.sucursal_id = params.sucursal_id;
    if (params?.tipoStock_id) where.tipoStock_id = params.tipoStock_id;

    return this.prismaService.disponibilidadStockSucursal.findMany({
      where,
      orderBy: [{ sucursal_id: 'asc' }, { tipoStock_id: 'asc' }, { diaSemana: 'asc' }],
      include: {
        sucursal: true,
        tipoStock: true,
      },
    });
  }

// =========== OBTENER POR SUCURSAL + TIPO (solo tipoStock activo) ===========
async getDisponibilidadForSucursalTipo(sucursalId: number, tipoStockId: number) {
  const registros = await this.prismaService.disponibilidadStockSucursal.findMany({
    where: {
      sucursal_id: sucursalId,
      tipoStock_id: tipoStockId,
      tipoStock: { activo: true }, // <-- filtra por tipoStock activo
    },
    orderBy: { diaSemana: 'asc' },
    include: { tipoStock: true },
  });

  return {
    sucursal_id: sucursalId,
    tipoStock_id: tipoStockId,
    diasSemana: registros.map((r) => r.diaSemana),
    registros,
  };
}

  // =========== UPDATE POR ID ===========
  async updateDisponibilidad(id: number, dto: UpdateDisponibilidadStockSucursalDto) {
    const existe = await this.prismaService.disponibilidadStockSucursal.findUnique({ where: { id } });
    if (!existe) throw new NotFoundException('Disponibilidad no encontrada');

    return this.prismaService.disponibilidadStockSucursal.update({
      where: { id },
      data: {
        ...(dto.tipoStock_id !== undefined ? { tipoStock_id: dto.tipoStock_id } : {}),
        ...(dto.diaSemana !== undefined ? { diaSemana: dto.diaSemana } : {}),
      },
    });
  }

  // =========== DELETE POR ID ===========
  async removeDisponibilidadById(id: number) {
    const existe = await this.prismaService.disponibilidadStockSucursal.findUnique({ where: { id } });
    if (!existe) throw new NotFoundException('Disponibilidad no encontrada');

    await this.prismaService.disponibilidadStockSucursal.delete({ where: { id } });
    return { ok: true, deletedId: id };
  }
}
