import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. Set global API prefix
  app.setGlobalPrefix('api');

  // 2. Enable CORS with local nextjs origin
  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
  });

  // 3. Register Express middlewares
  app.use(cookieParser());

  // 4. Global Validation Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // 5. Integrate OpenAPI/Swagger for API exploration
  const config = new DocumentBuilder()
    .setTitle('InboxIQ AI - Backend Services')
    .setDescription('REST API definitions and schemas for the InboxIQ email synchronization system.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // 6. Bind to port and start
  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`🚀 NestJS Server running at: http://localhost:${port}/api`);
  logger.log(`📘 OpenAPI Swagger explorer at: http://localhost:${port}/docs`);
}

bootstrap();
