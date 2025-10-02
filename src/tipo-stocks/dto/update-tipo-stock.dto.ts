import { PartialType } from '@nestjs/swagger';
import { CreateTipoStockDto } from './create-tipo-stock.dto';

export class UpdateTipoStockDto extends PartialType(CreateTipoStockDto) {}
