import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientStatusesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.clientStatus.findMany({ orderBy: { name: 'asc' } });
  }
}
