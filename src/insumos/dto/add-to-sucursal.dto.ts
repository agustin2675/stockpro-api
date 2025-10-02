import { ApiProperty } from "@nestjs/swagger";
import { IsInt, Min } from "class-validator";
import { Type } from "class-transformer";

export class AddToSucursalDto {
  @ApiProperty()
  @Type(() => Number) @IsInt()
  sucursal_id: number;

  @ApiProperty()
  @Type(() => Number) @IsInt()
  insumo_id: number;

  @ApiProperty()
  @Type(() => Number) @IsInt()
  tipoStock_id: number;

  @ApiProperty()
  @Type(() => Number) @IsInt() @Min(0)
  cantidadReal: number;

  @ApiProperty()
  @Type(() => Number) @IsInt() @Min(0)
  cantidadIdeal: number;

  @ApiProperty()
  @Type(() => Number) @IsInt() @Min(0)
  cantidadMinima: number;
}
