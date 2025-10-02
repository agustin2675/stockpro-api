import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Put, Res, StreamableFile } from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('pedidos')
@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Post()
  async create(@Body() createPedidoDto: CreatePedidoDto) {
    let pedido = await this.pedidosService.create(createPedidoDto);
    await this.pedidosService.generarYPersistirPDF(pedido.id);
    return pedido
  }

  @Get()
  async findAll(
  ) {
    return this.pedidosService.findAll();
    
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.pedidosService.findOne(+id);
  }
  
  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.pedidosService.update(Number(id), body);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.pedidosService.remove(+id);
  }
}
