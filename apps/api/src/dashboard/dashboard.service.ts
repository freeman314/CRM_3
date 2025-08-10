import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const now = new Date();
    const in14 = new Date(now.getTime());
    in14.setDate(in14.getDate() + 14);
    const in30 = new Date(now.getTime());
    in30.setDate(in30.getDate() + 30);

    const [expiring14, expiring30, tasksToday, tasksWeek, recentCalls, recentTasks] = await this.prisma.$transaction([
      this.prisma.client.count({ where: { contractEndDate: { gte: now, lte: in14 } } }),
      this.prisma.client.count({ where: { contractEndDate: { gte: now, lte: in30 } } }),
      this.prisma.task.count({
        where: {
          dueDate: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
          },
        },
      }),
      this.prisma.task.count({ where: { dueDate: { gte: now, lte: in7Days(now) } } }),
      this.prisma.call.findMany({ orderBy: { dateTime: 'desc' }, take: 10, include: { client: true, manager: true } }),
      this.prisma.task.findMany({ orderBy: { updatedAt: 'desc' }, take: 10, include: { client: true, assignedTo: true } }),
    ]);

    return {
      contracts: { in14: expiring14, in30: expiring30 },
      tasks: { today: tasksToday, week: tasksWeek },
      recentCalls,
      recentTasks,
    };
  }
}

function in7Days(from: Date): Date {
  const d = new Date(from.getTime());
  d.setDate(d.getDate() + 7);
  return d;
}


