import { PartialType } from '@nestjs/swagger';
import { CreateSucursaleDto } from './create-sucursale.dto';

export class UpdateSucursaleDto extends PartialType(CreateSucursaleDto) {}
