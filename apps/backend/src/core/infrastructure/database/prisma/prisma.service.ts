import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('Prisma');

  constructor() {
    const rawUrl = process.env.DATABASE_URL?.trim();
    super({
      ...(rawUrl ? { datasources: { db: { url: rawUrl } } } : {}),
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
    if (!rawUrl) {
      this.logger.error('ATENÇÃO: DATABASE_URL não encontrada em process.env!');
    }
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Banco de dados conectado');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
