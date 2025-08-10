import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async validateUser(username: string, pass: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const match = await bcrypt.compare(pass, user.passwordHash);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    if (!user.active) {
      throw new ForbiddenException('Account is deactivated');
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async login(username: string, password: string) {
    const user = await this.validateUser(username, password);
    const payload = { username: user.username, sub: user.id, role: user.role, firstLogin: (user as any).firstLogin, active: (user as any).active };
    const access_token = await this.jwtService.signAsync(payload);
    const refresh_token = await this.generateAndStoreRefreshToken(user.id);
    return { access_token, refresh_token, firstLogin: (await this.prisma.user.findUnique({ where: { id: user.id }, select: { firstLogin: true } }))?.firstLogin };
  }

  private async generateAndStoreRefreshToken(userId: string) {
    const refreshPayload = { sub: userId, type: 'refresh' };
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
      expiresIn: '7d',
    });
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { refreshTokenHash: hash } });
    return refreshToken;
  }

  async refresh(userId: string, refreshToken: string) {
    // Verify refresh token signature and expiration
    let decoded: any;
    try {
      decoded = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh');
    }

    // Enforce that provided userId matches token subject
    if (!decoded?.sub || decoded.sub !== userId) {
      throw new ForbiddenException('Invalid refresh');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.refreshTokenHash) throw new UnauthorizedException('Invalid refresh');
    const valid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!valid) throw new ForbiddenException('Invalid refresh');
    const payload = { username: user.username, sub: user.id, role: user.role, firstLogin: user.firstLogin, active: (user as any).active };
    const access_token = await this.jwtService.signAsync(payload);
    const new_refresh_token = await this.generateAndStoreRefreshToken(user.id);
    return { access_token, refresh_token: new_refresh_token };
  }

  async logout(userId: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { refreshTokenHash: null } });
    return { success: true };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new ForbiddenException('Current password incorrect');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash, firstLogin: false } });
    return { success: true };
  }
}
