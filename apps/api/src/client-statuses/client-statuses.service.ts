import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientStatusDto } from './dto/create-client-status.dto';
import { UpdateClientStatusDto } from './dto/update-client-status.dto';

@Injectable()
export class ClientStatusesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.clientStatus.findMany({ orderBy: { name: 'asc' } });
  }

  async findById(id: string) {
    const status = await this.prisma.clientStatus.findUnique({ where: { id } });
    if (!status) throw new NotFoundException('ClientStatus not found');
    return status;
  }

  create(dto: CreateClientStatusDto) {
    return this.prisma.clientStatus.create({ data: dto });
  }

  async update(id: string, dto: UpdateClientStatusDto) {
    await this.ensureExists(id);
    return this.prisma.clientStatus.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.clientStatus.delete({ where: { id } });
    return { id };
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.clientStatus.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('ClientStatus not found');
  }
}
