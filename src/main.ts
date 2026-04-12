import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { seed } from './seeders/seed';
import { Sequelize } from 'sequelize-typescript';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error on unknown properties
      transform: true, // Auto-transform payloads to DTO instances
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  app.enableCors({
    origin: '*',
  });

  // Sync database and seed if RUN_SEED is set, or in development
  if (process.env.RUN_SEED === 'true' || process.env.NODE_ENV !== 'production') {
    const sequelize = app.get(Sequelize);
    await sequelize.sync({ alter: true });
    await seed();
  }

  // Swagger docs
  const config = new DocumentBuilder()
    .setTitle('Heritage Storytelling Platform')
    .setDescription('Trace of the Tides — API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  const baseUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`;
  console.log(`🚀 Server running on ${baseUrl}`);
  console.log(`📚 Swagger docs at ${baseUrl}/api/docs`);
}
bootstrap();
