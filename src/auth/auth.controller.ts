import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { LoginUserDto } from './dto/login.dto';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
  Login with username and password to get a JWT token
  This is used for authenticating users on the Backoffice
  */
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'User login and JWT token generation' })
  @ApiBody({ type: LoginUserDto, description: 'User credentials' })
  @ApiResponse({ status: 200, description: 'JWT access token returned' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or user not found' })
  login(@Body() body: LoginUserDto) {
    return this.authService.login(body.username, body.password);
  }
}