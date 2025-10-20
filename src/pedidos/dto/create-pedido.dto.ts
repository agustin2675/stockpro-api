import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';

export class DetallePedidoDto {
  @ApiProperty({ type: Number, example: 12 })
  insumo_id: number;

  @ApiProperty({ type: Number, example: 1 })
  tipoStock_id: number;

  @ApiProperty({ type: Number, example: 5 })
  cantidadPedido: number;

  @ApiProperty({ type: Number, example: 5 })
  cantidadReal: number;

  @ApiProperty({ type: Number, example: 5 })
  cantidadIdeal: number;
}

@ApiExtraModels(DetallePedidoDto)
export class CreatePedidoDto {
  @ApiProperty({ type: Number })
  sucursal_id: number;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2025-08-28T13:00:00.000Z',
  })
  dateTime: string;

  @ApiProperty({ type: () => [DetallePedidoDto] })
  detalles: DetallePedidoDto[];
}
