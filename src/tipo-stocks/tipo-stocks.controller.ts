import { Controller, Get, Post, Body, Patch, Param, Delete, Put } from '@nestjs/common';
import { TipoStocksService } from './tipo-stocks.service';
import { CreateTipoStockDto } from './dto/create-tipo-stock.dto';
import { UpdateTipoStockDto } from './dto/update-tipo-stock.dto';
import { ApiTags } from '@nestjs/swagger';

@Controller('tipo-stocks')
@ApiTags('tipo-stocks')
export class TipoStocksController {
  constructor(private readonly tipoStocksService: TipoStocksService) {}

  @Post()
  create(@Body() createTipoStockDto: CreateTipoStockDto) {
    return this.tipoStocksService.create(createTipoStockDto);
  }

  @Get()
  findAll() {
    return this.tipoStocksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tipoStocksService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateTipoStockDto: UpdateTipoStockDto) {
    return this.tipoStocksService.update(+id, updateTipoStockDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tipoStocksService.remove(+id);
  }
}
