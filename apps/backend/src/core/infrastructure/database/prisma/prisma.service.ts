import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('Prisma');

  constructor() {
    let rawUrl = process.env.DATABASE_URL?.trim();
    if (!rawUrl && fs.existsSync('/etc/secrets/DATABASE_URL')) {
      try {
        rawUrl = fs.readFileSync('/etc/secrets/DATABASE_URL', 'utf8').trim();
      } catch {}
    }

    super({
      ...(rawUrl ? { datasources: { db: { url: rawUrl } } } : {}),
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });

    if (rawUrl) {
      process.env.DATABASE_URL = rawUrl;
      if (!process.env.DIRECT_URL) {
        process.env.DIRECT_URL = rawUrl;
      }
    } else {
      this.logger.error('ATENÇÃO: DATABASE_URL não encontrada em process.env nem em /etc/secrets/DATABASE_URL!');
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
