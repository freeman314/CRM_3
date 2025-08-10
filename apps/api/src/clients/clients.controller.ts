import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ListClientsQueryDto } from './dto/list-clients-query.dto';

@ApiTags('clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('manager', 'chief_manager', 'admin')
@Controller('clients')
export class ClientsController {
  constructor(private readonly service: ClientsService) {}

  @Get()
  @ApiOkResponse({ description: 'Список клиентов' })
  getAll(@Query() query: ListClientsQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Клиент по id' })
  getById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  @Roles('manager', 'chief_manager', 'admin')
  create(@Body() dto: CreateClientDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('manager', 'chief_manager', 'admin')
  update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'chief_manager')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}



