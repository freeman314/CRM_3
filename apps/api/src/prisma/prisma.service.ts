import { INestApplication, Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  async enableShutdownHooks(app: INestApplication): Promise<void> {
    // @ts-expect-error Prisma types do not expose beforeExit event type in a strict setup
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
