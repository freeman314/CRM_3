import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AccountGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { userId: string; username: string; role: string; firstLogin?: boolean; active?: boolean } | undefined;

    if (!user) return true;

    const path: string = request.route?.path || request.url || '';
    const isChangePassword = path.includes('/auth/change-password');
    const isAuthRefresh = path.includes('/auth/refresh');
    const isAuthLogout = path.includes('/auth/logout');

    if (user.active === false) {
      throw new ForbiddenException('Account is deactivated');
    }

    if (user.firstLogin && !isChangePassword && !isAuthRefresh && !isAuthLogout) {
      throw new ForbiddenException('Password change required on first login');
    }

    return true;
  }
}


