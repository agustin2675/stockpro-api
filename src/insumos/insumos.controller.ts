import { Controller, Get, Post, Body, Param, Delete, Put, ParseIntPipe, Query } from '@nestjs/common';
import { InsumosService } from './insumos.service';
import { CreateInsumoDto } from './dto/create-insumo.dto';
import { UpdateInsumoDto } from './dto/update-insumo.dto';
import { ApiTags } from '@nestjs/swagger';
import { AddToSucursalDto } from './dto/add-to-sucursal.dto';

@ApiTags('insumos')
@Controller('insumos')
export class InsumosController {
  constructor(private readonly insumosService: InsumosService) {}

  @Post()
  create(@Body() createInsumoDto: CreateInsumoDto) {
    return this.insumosService.create(createInsumoDto);
  }

  @Get()
  findAll() {
    return this.insumosService.findAll();
  }

  // ---------- NUEVO: SucursalInsumo ----------
  @Post('sucursal')
  addToSucursal(@Body() dto: AddToSucursalDto) {
    return this.insumosService.addToSucursal(dto);
  }

  @Post('sucursal')
  createOrUpdateSucursalInsumo(@Body() dto: AddToSucursalDto) {
    return this.insumosService.upsertToSucursal(dto);
  }

@Get('sucursal')
listSucursalInsumo(
  @Query('sucursal_id') sucursalIdQ?: string,
  @Query('insumo_id') insumoIdQ?: string,
  @Query('tipoStock_id') tipoStockIdQ?: string,      // <- agregado opcional
) {
  const sucursal_id = sucursalIdQ ? Number(sucursalIdQ) : undefined;
  const insumo_id   = insumoIdQ   ? Number(insumoIdQ)   : undefined;
  const tipoStock_id= tipoStockIdQ? Number(tipoStockIdQ): undefined;
  return this.insumosService.listSucursalInsumo({ sucursal_id, insumo_id, tipoStock_id });
}

  @Get('sucursal/:id')
  getSucursalInsumo(@Param('id', ParseIntPipe) id: number) {
    return this.insumosService.getSucursalInsumoById(id);
  }

  @Put('sucursal/:id')
  updateSucursalInsumo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddToSucursalDto,
  ) {
    return this.insumosService.updateSucursalInsumo(id, dto);
  }

  @Delete('sucursal/:id')
  removeSucursalInsumo(@Param('id', ParseIntPipe) id: number) {
    return this.insumosService.removeSucursalInsumo(id);
  }

  // --- Opcional: Upsert (si agregaste @@unique([sucursal_id, insumo_id]))
  @Put('sucursal/upsert')
  upsertToSucursal(@Body() dto: AddToSucursalDto) {
    return this.insumosService.upsertToSucursal(dto);
  }

  // ---------- Rutas genéricas por ID del Insumo (dejarlas al final) ----------
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.insumosService.findOne(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateInsumoDto: UpdateInsumoDto) {
    return this.insumosService.update(id, updateInsumoDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.insumosService.remove(id);
  }
}