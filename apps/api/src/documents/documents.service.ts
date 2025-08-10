import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  listByClient(clientId: string) {
    return this.prisma.document.findMany({ where: { clientId }, orderBy: { createdAt: 'desc' } });
  }

  async remove(id: string, userId: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    await this.prisma.document.delete({ where: { id } });
    await this.audit.log({ userId, action: 'document.delete', method: 'DELETE', path: `/documents/${id}`, entity: 'Document', entityId: id });
    return { id };
  }
}


