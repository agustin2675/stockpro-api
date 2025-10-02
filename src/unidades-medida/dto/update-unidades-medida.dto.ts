import { PartialType } from '@nestjs/swagger';
import { CreateUnidadesMedidaDto } from './create-unidades-medida.dto';

export class UpdateUnidadesMedidaDto extends PartialType(CreateUnidadesMedidaDto) {}
