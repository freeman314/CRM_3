import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListClientsQueryDto } from './dto/list-clients-query.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListClientsQueryDto) {
    const { page = 1, pageSize = 20, q, statusId, dueInDays, contractEndFrom, contractEndTo } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (q) {
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (statusId) where.statusId = statusId;
    if (typeof dueInDays === 'number') {
      const now = new Date();
      const to = new Date();
      to.setDate(now.getDate() + dueInDays);
      where.contractEndDate = { gte: now, lte: to };
    }
    if (contractEndFrom || contractEndTo) {
      where.contractEndDate = {
        ...(where.contractEndDate || {}),
        ...(contractEndFrom ? { gte: new Date(contractEndFrom) } : {}),
        ...(contractEndTo ? { lte: new Date(contractEndTo) } : {}),
      };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.client.findMany({
        where,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        include: { status: true, category: true, city: true },
        skip,
        take: pageSize,
      }),
      this.prisma.client.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findById(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: { status: true, category: true, city: true, tasks: true, calls: true },
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  create(dto: CreateClientDto) {
    const { cityId, statusId, categoryId, assignedManagerId, ...data } = dto;
    return this.prisma.client.create({
      data: {
        ...data,
        city: cityId ? { connect: { id: cityId } } : undefined,
        status: statusId ? { connect: { id: statusId } } : undefined,
        category: categoryId ? { connect: { id: categoryId } } : undefined,
        assignedManager: assignedManagerId ? { connect: { id: assignedManagerId } } : undefined,
      },
      include: { status: true, category: true, city: true },
    });
  }

  async update(id: string, dto: UpdateClientDto) {
    await this.ensureExists(id);
    const { cityId, statusId, categoryId, assignedManagerId, ...data } = dto;
    return this.prisma.client.update({
      where: { id },
      data: {
        ...data,
        city: cityId !== undefined ? (cityId ? { connect: { id: cityId } } : { disconnect: true }) : undefined,
        status: statusId !== undefined ? (statusId ? { connect: { id: statusId } } : { disconnect: true }) : undefined,
        category: categoryId !== undefined ? (categoryId ? { connect: { id: categoryId } } : { disconnect: true }) : undefined,
        assignedManager:
          assignedManagerId !== undefined
            ? assignedManagerId
              ? { connect: { id: assignedManagerId } }
              : { disconnect: true }
            : undefined,
      },
      include: { status: true, category: true, city: true },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.client.delete({ where: { id } });
    return { id };
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.client.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('Client not found');
  }
}



