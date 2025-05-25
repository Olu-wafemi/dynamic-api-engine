import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Dynamic Custom API Engine')
    .setDescription('Custom API endpoints with runtime validation')
    .setVersion('1.0')
    .addTag('Dynamic APIs', 'Endpoints for dynamic API execution')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'x-api-key')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
    extraModels: [],
  });

  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
  });

  await app.listen(3000);
  console.log('Application is now running');
  console.log(`Swagger docs is running at: /api-docs`);
}
bootstrap();
