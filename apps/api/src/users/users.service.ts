import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      // Cast to any until prisma generate runs for new fields
      select: ({ id: true, username: true, email: true, role: true, active: true, firstLogin: true, createdAt: true, updatedAt: true } as any),
    });
  }

  async create(dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: ({ username: dto.username, email: dto.email, role: dto.role, passwordHash, firstLogin: true, active: true } as any),
      select: ({ id: true, username: true, email: true, role: true, active: true, firstLogin: true, createdAt: true, updatedAt: true } as any),
    });
  }

  async update(id: string, dto: UpdateUserDto, actingUserId: string) {
    await this.ensureExists(id);
    if (dto.role && actingUserId === id) {
      throw new ForbiddenException('Cannot change your own role');
    }
    return this.prisma.user.update({
      where: { id },
      data: ({ username: dto.username, email: dto.email, role: dto.role, active: dto.active, firstLogin: dto.firstLogin } as any),
      select: ({ id: true, username: true, email: true, role: true, active: true, firstLogin: true, createdAt: true, updatedAt: true } as any),
    });
  }

  async resetPassword(id: string, newPassword: string) {
    await this.ensureExists(id);
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id }, data: { passwordHash, firstLogin: true } });
    return { id };
  }

  async remove(id: string, actingUserId: string) {
    if (id === actingUserId) throw new ForbiddenException('Cannot delete yourself');
    await this.ensureExists(id);
    await this.prisma.user.delete({ where: { id } });
    return { id };
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('User not found');
  }
}


