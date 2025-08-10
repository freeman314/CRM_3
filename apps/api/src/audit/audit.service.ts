import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    userId?: string;
    action: string;
    method: string;
    path: string;
    ip?: string;
    entity?: string;
    entityId?: string;
    metadata?: any;
  }) {
    try {
      await this.prisma.auditLog.create({ data: { ...params } as any });
    } catch {}
  }
}


