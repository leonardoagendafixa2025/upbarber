import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// 1. Carrega todas as variáveis salvas em /etc/secrets (suporta Secret Files do Render)
if (fs.existsSync('/etc/secrets')) {
  try {
    const files = fs.readdirSync('/etc/secrets');
    for (const file of files) {
      const fullPath = path.join('/etc/secrets', file);
      if (fs.statSync(fullPath).isFile()) {
        const val = fs.readFileSync(fullPath, 'utf8').trim();
        if (file === '.env') {
          dotenv.config({ path: fullPath });
        } else if (!process.env[file]) {
          process.env[file] = val;
        }
      }
    }
  } catch (err) {}
}

// 2. Carrega .env do diretório atual se existir
if (fs.existsSync(path.resolve(process.cwd(), '.env'))) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
} else {
  dotenv.config();
}

// Garante que DIRECT_URL não fique nula caso DATABASE_URL exista
if (process.env.DATABASE_URL && !process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

import { NestFactory, Reflector } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { SerializeInterceptor } from './common/interceptors/serialize.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: false,
    rawBody: true,
  });
  app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 2));
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));

  const origins = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({
    origin: (origin, cb) => {
      if (!origin || origins.includes(origin) || origins.includes('*')) return cb(null, true);
      // subdomínios do domínio base da plataforma (sites das barbearias)
      const base = process.env.PLATFORM_DOMAIN;
      if (base && origin.endsWith(`.${base}`)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidUnknownValues: false }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new SerializeInterceptor());
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector));

  const config = new DocumentBuilder()
    .setTitle('UP BARBER API')
    .setDescription('Sistema de gestão para barbearias: agenda online, comandas, caixa, estoque, comissões, fidelidade e comunicação.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, { swaggerOptions: { persistAuthorization: true } });

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
  Logger.log(`API em http://localhost:${port}/api  |  docs em /api/docs`, 'Bootstrap');
}

bootstrap();
