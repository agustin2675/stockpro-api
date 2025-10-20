import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Put, StreamableFile, Res } from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

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

@Get('imprimir/:id')
async print(@Param('id') id: string): Promise<StreamableFile> {
  const buffer = await this.pedidosService.generatePedidoPdfById(+id);
  return new StreamableFile(buffer, {
    type: 'application/pdf',
    disposition: `inline; filename=pedido_${id}.pdf`,
  });
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
  async update(@Param('id') id: string, @Body() body: any) {
    await this.pedidosService.update(Number(id), body)
    return await this.pedidosService.generarYPersistirPDF(Number(id));
    ;
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.pedidosService.remove(+id);
  }
}
