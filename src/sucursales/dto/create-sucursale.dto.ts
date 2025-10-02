import { ApiProperty } from "@nestjs/swagger"
import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSucursaleDto {
    @ApiProperty()
    @IsString()
    nombre: string

    @ApiProperty()
    @IsString()
    @IsOptional()
    direccion: string
    
    @ApiProperty()
    @IsString()
    @IsOptional()
    telefono: string
}
