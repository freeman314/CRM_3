import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';

@Injectable()
export class CitiesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.city.findMany({ orderBy: [{ name: 'asc' }, { region: 'asc' }] });
  }

  async findById(id: string) {
    const item = await this.prisma.city.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('City not found');
    return item;
  }

  create(dto: CreateCityDto) {
    return this.prisma.city.create({ data: dto });
  }

  async update(id: string, dto: UpdateCityDto) {
    await this.ensureExists(id);
    return this.prisma.city.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.city.delete({ where: { id } });
    return { id };
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.city.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('City not found');
  }
}


