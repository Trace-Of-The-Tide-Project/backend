import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { seed } from './database/seeders/seed';
import { Sequelize } from 'sequelize-typescript';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new AllExceptionsFilter());
  const sequelize = app.get(Sequelize);

  await sequelize.sync({ force: true });

  await seed();

  const config = new DocumentBuilder()
    .setTitle('Heritage Storytelling Platform')
    .setDescription('API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
}
bootstrap();
