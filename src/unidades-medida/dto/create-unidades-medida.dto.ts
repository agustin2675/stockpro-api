import { ApiProperty } from "@nestjs/swagger";
import { IsString } from 'class-validator';

export class CreateUnidadesMedidaDto {
    @ApiProperty()
    @IsString()
    nombre: string
}
