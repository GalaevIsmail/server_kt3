import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
  const document = SwaggerModule.createDocument(app, new DocumentBuilder()
    .setTitle('Sellers API').setDescription('Продавцы и товары — NestJS, PostgreSQL, TypeORM')
    .setVersion('1.0').build());
  SwaggerModule.setup('api', app, document);
  app.enableShutdownHooks();
  await app.listen(Number(app.get(ConfigService).get('PORT', 3000)), '0.0.0.0');
}
bootstrap().catch(error => { console.error(error); process.exit(1); });
