import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCallDto } from './dto/create-call.dto';
import { ListCallsQueryDto } from './dto/list-calls-query.dto';

@Injectable()
export class CallsService {
  constructor(private readonly prisma: PrismaService) {}

  findByClient(clientId: string) {
    return this.prisma.call.findMany({
      where: { clientId },
      orderBy: { dateTime: 'desc' },
      include: { newStatus: true, client: true, manager: true },
    });
  }

  async list(query: ListCallsQueryDto) {
    const { page = 1, pageSize = 20, from, to, clientId, managerId } = query;
    const skip = (page - 1) * pageSize;
    const where: any = {};
    if (from || to) {
      where.dateTime = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }
    if (clientId) where.clientId = clientId;
    if (managerId) where.managerId = managerId;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.call.findMany({ where, orderBy: { dateTime: 'desc' }, skip, take: pageSize, include: { client: true, manager: true, newStatus: true } }),
      this.prisma.call.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async create(dto: CreateCallDto) {
    // Ensure related entities exist
    const [client, manager] = await this.prisma.$transaction([
      this.prisma.client.findUnique({ where: { id: dto.clientId }, select: { id: true } }),
      this.prisma.user.findUnique({ where: { id: dto.managerId }, select: { id: true } }),
    ]);
    if (!client) throw new NotFoundException('Client not found');
    if (!manager) throw new NotFoundException('Manager not found');

    const created = await this.prisma.call.create({
      data: {
        client: { connect: { id: dto.clientId } },
        manager: { connect: { id: dto.managerId } },
        result: dto.result,
        comment: dto.comment,
        newStatus: dto.newStatusId ? { connect: { id: dto.newStatusId } } : undefined,
        newPotential: dto.newPotential,
      },
      include: { newStatus: true },
    });

    // If status/potential should be updated on client
    if (dto.newStatusId || dto.newPotential) {
      await this.prisma.client.update({
        where: { id: dto.clientId },
        data: {
          status: dto.newStatusId ? { connect: { id: dto.newStatusId } } : undefined,
          potential: dto.newPotential ?? undefined,
        },
      });
    }
    return created;
  }
}


