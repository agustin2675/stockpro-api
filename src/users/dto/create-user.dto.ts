import { ApiProperty } from "@nestjs/swagger"
import { IsEnum, IsNumber, IsString } from "class-validator"
import { Rol } from '@prisma/client';


export class CreateUserDto{
    @ApiProperty()
    @IsString()
    username: string
    @ApiProperty()
    @IsString()
    password: string
    @ApiProperty()
    @IsString()
    telefono: string
    @ApiProperty()
    @IsEnum(Rol)
    rol: Rol
    @ApiProperty()
    @IsNumber()
    sucursal_id: number
}