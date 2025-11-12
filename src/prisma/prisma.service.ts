import { Injectable, OnModuleInit, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    // PrismaClient typings for $on may vary between versions; cast to any to ensure compatibility.
    (this as any).$on('beforeExit', async () => {
      await app.close();
    });
  }
}
