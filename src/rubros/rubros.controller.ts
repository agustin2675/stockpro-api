import { Controller, Get, Post, Body, Patch, Param, Delete, Put } from '@nestjs/common';
import { RubrosService } from './rubros.service';
import { CreateRubroDto } from './dto/create-rubro.dto';
import { UpdateRubroDto } from './dto/update-rubro.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('rubros')
@Controller('rubros')
export class RubrosController {
  constructor(private readonly rubrosService: RubrosService) {}

  @Post()
  create(@Body() createRubroDto: CreateRubroDto) {
    return this.rubrosService.create(createRubroDto);
  }

  @Get()
  findAll() {
    return this.rubrosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rubrosService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateRubroDto: UpdateRubroDto) {
    return this.rubrosService.update(+id, updateRubroDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rubrosService.remove(+id);
  }
}
