import { Module } from '@nestjs/common';
import { ClientStatusesService } from './client-statuses.service';
import { ClientStatusesController } from './client-statuses.controller';

@Module({
  controllers: [ClientStatusesController],
  providers: [ClientStatusesService],
})
export class ClientStatusesModule {}
