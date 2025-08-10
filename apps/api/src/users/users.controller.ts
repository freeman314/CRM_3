import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService, private readonly prisma: PrismaService) {}

  @Get('me')
  me(@Req() req: any) {
    return this.prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, username: true, role: true, firstLogin: true, active: true },
    });
  }

  @Get()
  @ApiOkResponse({ description: 'List users' })
  @Roles('admin')
  list() {
    return this.users.list();
  }

  @Post()
  @Roles('admin')
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @Req() req: any) {
    return this.users.update(id, dto as any, req.user.userId);
  }

  @Post(':id/reset-password')
  @Roles('admin')
  resetPassword(@Param('id') id: string, @Body() body: { newPassword: string }) {
    return this.users.resetPassword(id, body.newPassword);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.users.remove(id, req.user.userId);
  }
}
