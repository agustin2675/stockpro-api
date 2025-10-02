import { PartialType } from "@nestjs/swagger";
import { AddDisponibilidadStockSucursalDto } from "./add-disponibilidad-stock-sucursal.dto";

export class UpdateDisponibilidadStockSucursalDto extends PartialType(AddDisponibilidadStockSucursalDto) {}
