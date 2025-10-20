import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { JwtPayload } from './interfaces/jwt.interface';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  /**
   * User login
   * Validate user credentials and return a JWT token if valid
   */
  async login(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findByUserName(username);

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const isPasswordMatching = await bcrypt.compare(pass, user.password);
    if (!isPasswordMatching) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Payload for JWT token
    // You can include any additional information you want in the token payload
    const payload: JwtPayload = {
      sub: user.id,
      name: user.nombre,
      roles: [user.rol],
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      rol: user.rol,
      sucursalId: user.sucursal_id,
      sucursalName: user.sucursal.nombre
    };
  }

}
