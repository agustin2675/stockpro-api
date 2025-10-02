import { ApiProperty } from "@nestjs/swagger"
import { IsString } from 'class-validator';

export class CreateRubroDto {
    @ApiProperty()
    @IsString()
    nombre: string
}
