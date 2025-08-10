import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  @Get('logs')
  @Roles('admin')
  async logs(@Query('page') page = 1, @Query('pageSize') pageSize = 50) {
    const skip = (Number(page) - 1) * Number(pageSize);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, skip, take: Number(pageSize) }),
      this.prisma.auditLog.count(),
    ]);
    return { items, total, page: Number(page), pageSize: Number(pageSize) };
  }
}


