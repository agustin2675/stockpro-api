import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";


export class UpdatePasswordDTO{

    @ApiProperty()
    @IsString()
    password: string

    @ApiProperty()
    @IsNumber()
    user_id: number
}