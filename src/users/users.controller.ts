import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { UpdatePasswordDTO } from './dto/update-password.dto';

@Controller('users')
@ApiTags('users')
export class UsersController {

    constructor(private usersService: UsersService){

    }

    @Get()
    getAll(){
        return this.usersService.getAll()
    }

    @Post()
    create(@Body() createUserDto: CreateUserDto){
        return this.usersService.create(createUserDto)
    }

    @Put()
    modificarPassword(@Body() updatePasswordDTO: UpdatePasswordDTO){
        return this.usersService.modificarPassword(updatePasswordDTO.user_id,updatePasswordDTO.password)
    }

  @Delete(':id')
  @ApiParam({ name: 'id', type: Number, description: 'ID del usuario' })
  desactivarUsuario(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.desactivarUsuario(id);
  }
}
