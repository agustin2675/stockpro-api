import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt'
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {

    constructor(private prismaService: PrismaService){

    }

    async getAll(){
        return this.prismaService.usuario.findMany({
      where:{
        activo: true
      }
    });
    }

    async findByUserName(userName: string){
        return await this.prismaService.usuario.findFirst({
            where: {
                nombre: userName
            },
            include:{
              sucursal: true
            }
        })
    }

    async create({ username, password, telefono, rol, sucursal_id }: CreateUserDto) {
    const existingUser = await this.prismaService.usuario.findFirst({ where: { nombre:username } });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await this.hashPassword(password);

    const newUser = await this.prismaService.usuario.create({
      data: {
        nombre: username,
        password: hashedPassword,
        activo: true,
        telefono,
        rol,
        sucursal_id
      }
    });

    const { password: _, ...result } = newUser;
    return result;
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  async desactivarUsuario(usuario_id: number){
    return await this.prismaService.usuario.update({
        where: {
            id: usuario_id
        }, data: {
            activo: false
        }
    })
  }

  async modificarPassword(usuario_id: number, password: string){
    const hashedPassword = await this.hashPassword(password);

    return this.prismaService.usuario.update({
        where: {
            id: usuario_id
        }, data: {
            password: hashedPassword
        }
    })

  }
}
