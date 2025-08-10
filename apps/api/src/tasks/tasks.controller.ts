import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly service: TasksService) {}

  @Get()
  list(@Query() query: ListTasksQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  @Roles('manager', 'chief_manager', 'admin')
  create(@Body() dto: CreateTaskDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('manager', 'chief_manager', 'admin')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('chief_manager', 'admin')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}


