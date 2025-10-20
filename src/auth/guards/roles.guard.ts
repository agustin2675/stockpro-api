import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SetMetadata } from '@nestjs/common';
import { JwtPayload } from '../interfaces/jwt.interface';

// Custom decorator to set roles metadata on route handlers
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Read the roles metadata from the route handler
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());

    // If no roles are defined, allow access
    if (!requiredRoles) {
      return true;
    }

    // If roles are defined, check if the user has any of the required roles
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    // If user is not authenticated, deny access
    if (!user) {
      return false;
    }

    // Check if the user has any of the required roles
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}