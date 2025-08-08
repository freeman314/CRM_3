import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ClientStatusesModule } from './client-statuses/client-statuses.module';
import { HealthController } from './health.controller';

@Module({
  imports: [PrismaModule, ClientStatusesModule],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
