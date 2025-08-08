import { Controller, Get } from '@nestjs/common';
import { ClientStatusesService } from './client-statuses.service';

@Controller('client-statuses')
export class ClientStatusesController {
  constructor(private readonly service: ClientStatusesService) {}

  @Get()
  getAll() {
    return this.service.findAll();
  }
}
