import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
   imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET_KEY
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, UsersService, PrismaService]
})
export class AuthModule {}
