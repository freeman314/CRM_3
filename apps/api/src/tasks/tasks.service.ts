import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListTasksQueryDto) {
    const { page = 1, pageSize = 20, status, assignedToId, clientId, dueFrom, dueTo } = query;
    const skip = (page - 1) * pageSize;
    const where: any = {};
    if (status) where.status = status;
    if (assignedToId) where.assignedToId = assignedToId;
    if (clientId) where.clientId = clientId;
    if (dueFrom || dueTo) {
      where.dueDate = {
        ...(dueFrom ? { gte: new Date(dueFrom) } : {}),
        ...(dueTo ? { lte: new Date(dueTo) } : {}),
      };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        orderBy: { dueDate: 'asc' },
        skip,
        take: pageSize,
        include: { client: true, assignedTo: true },
      }),
      this.prisma.task.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async findById(id: string) {
    const item = await this.prisma.task.findUnique({ where: { id }, include: { client: true, assignedTo: true } });
    if (!item) throw new NotFoundException('Task not found');
    return item;
  }

  create(dto: CreateTaskDto) {
    return this.prisma.task.create({ data: dto });
  }

  async update(id: string, dto: UpdateTaskDto) {
    await this.ensureExists(id);
    return this.prisma.task.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.task.delete({ where: { id } });
    return { id };
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.task.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('Task not found');
  }
}


