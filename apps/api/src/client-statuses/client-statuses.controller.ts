import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ClientStatusesService } from './client-statuses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateClientStatusDto } from './dto/create-client-status.dto';
import { UpdateClientStatusDto } from './dto/update-client-status.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('client-statuses')
export class ClientStatusesController {
  constructor(private readonly service: ClientStatusesService) {}

  @Get()
  getAll() {
    return this.service.findAll();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  @Roles('admin', 'chief_manager')
  create(@Body() dto: CreateClientStatusDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('admin', 'chief_manager')
  update(@Param('id') id: string, @Body() dto: UpdateClientStatusDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
