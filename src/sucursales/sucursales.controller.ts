import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, Put } from '@nestjs/common';
import { SucursalesService } from './sucursales.service';
import { CreateSucursaleDto } from './dto/create-sucursale.dto';
import { UpdateSucursaleDto } from './dto/update-sucursale.dto';
import { ApiTags } from '@nestjs/swagger';
import { AddDisponibilidadStockSucursalDto } from './dto/add-disponibilidad-stock-sucursal.dto';
import { UpdateDisponibilidadStockSucursalDto } from './dto/update-disponibilidad.dto';

@ApiTags('sucursales')
@Controller('sucursales')
export class SucursalesController {
  constructor(private readonly sucursalesService: SucursalesService) {}

  @Post()
  create(@Body() createSucursaleDto: CreateSucursaleDto) {
    return this.sucursalesService.create(createSucursaleDto);
  }

  @Get()
  findAll() {
    return this.sucursalesService.findAll();
  }

  @Post('add-disponibilidad')
  addDisponibilidad(@Body() addDisponibilidadDto: AddDisponibilidadStockSucursalDto) {
    return this.sucursalesService.addDisponibilidad(addDisponibilidadDto);
  }

  // --- rutas específicas ANTES del ":id" ---

  @Get('disponibilidad')
  listDisponibilidad(
    @Query('sucursal_id') sucursalIdQ?: string,
    @Query('tipoStock_id') tipoStockIdQ?: string,
  ) {
    const sucursal_id = sucursalIdQ ? Number(sucursalIdQ) : undefined;
    const tipoStock_id = tipoStockIdQ ? Number(tipoStockIdQ) : undefined;
    return this.sucursalesService.listDisponibilidad({ sucursal_id, tipoStock_id });
  }

  @Get(':sucursalId/tipo/:tipoStockId')
  getForSucursalTipo(
    @Param('sucursalId', ParseIntPipe) sucursalId: number,
    @Param('tipoStockId', ParseIntPipe) tipoStockId: number,
  ) {
    return this.sucursalesService.getDisponibilidadForSucursalTipo(sucursalId, tipoStockId);
  }

  @Put('update-disponibilidad/:id')
  updateDisponibilidad(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDisponibilidadStockSucursalDto,
  ) {
    return this.sucursalesService.updateDisponibilidad(id, dto);
  }

  @Delete('remove-disponibilidad/:id')
  removeDisponibilidadById(@Param('id', ParseIntPipe) id: number) {
    return this.sucursalesService.removeDisponibilidadById(id);
  }

  // --- por ÚLTIMO las genéricas con :id ---

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sucursalesService.findOne(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateSucursaleDto: UpdateSucursaleDto) {
    return this.sucursalesService.update(id, updateSucursaleDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.sucursalesService.remove(id);
  }
}
