import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CallsService } from './calls.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateCallDto } from './dto/create-call.dto';
import { ListCallsQueryDto } from './dto/list-calls-query.dto';

@ApiTags('calls')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('calls')
export class CallsController {
  constructor(private readonly service: CallsService) {}

  @Get('client/:clientId')
  getByClient(@Param('clientId') clientId: string) {
    return this.service.findByClient(clientId);
  }

  @Get()
  list(@Query() query: ListCallsQueryDto) {
    return this.service.list(query);
  }

  @Post()
  @Roles('manager', 'chief_manager', 'admin')
  create(@Body() dto: CreateCallDto) {
    return this.service.create(dto);
  }
}


