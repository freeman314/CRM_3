import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, AppRole } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    // Defer authentication errors to auth guard to ensure 401 vs 403 semantics
    if (!user) return true;
    const allowed = requiredRoles.includes(user.role);
    if (!allowed) {
      this.logger.warn(`Denied role. Required: [${requiredRoles.join(', ')}], got: ${user.role}`);
    }
    return allowed;
  }
}



