
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SeedService } from './seed/seed.service';
import { ResponseInterceptor } from './common/response/response.interceptor';

import helmet from 'helmet';
import compression from 'compression';
import { GlobalExceptionFilter } from './common/filters/global-exception/global-exception.filter';

async function bootstrap() {

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

// ── Security ───────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
  })
);


  app.use(compression());

  // ── CORS ───────────────────────────────────────
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // ── Global Prefix ──────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ── Validation ─────────────────────────────────
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // ── Interceptors & Filters ─────────────────────
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ── Swagger ────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');
    const config = new DocumentBuilder()
      .setTitle('API Documentation')
      .setDescription('NestJS Backend API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
   SwaggerModule.setup('api/docs', app, document, {
  swaggerOptions: {
    url: '/api/docs-json',
  },
});
  }

  // ── Seed ───────────────────────────────────────
  const seedService = app.get(SeedService);
  await seedService.seedSuperAdmin();

  // ── Start ──────────────────────────────────────
  const port = process.env.PORT ?? 5000;
  await app.listen(port);

  Logger.log(`🚀 Server running on http://localhost:${port}/api/v1`, 'Bootstrap');
  Logger.log(`📄 Swagger: http://localhost:${port}/api/docs`, 'Bootstrap');
}

bootstrap();