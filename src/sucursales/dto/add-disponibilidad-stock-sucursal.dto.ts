import { ApiProperty } from "@nestjs/swagger"
import { IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class AddDisponibilidadStockSucursalDto {
    @IsInt()
    @Type(() => Number)
    sucursal_id: number;

    @IsInt()
    @Type(() => Number)
    tipoStock_id: number;

    @IsInt()
    @Type(() => Number)
    diaSemana: number;
}