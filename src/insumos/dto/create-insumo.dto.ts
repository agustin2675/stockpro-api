import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInsumoDto {
    @ApiProperty()
    @IsString()
    nombre: string

    @ApiProperty()
    @IsInt()
    @Type(() => Number)
    unidadDeMedida_id: number

    @ApiProperty()
    @IsInt()
    @Type(() => Number)
    rubro_id: number
}
