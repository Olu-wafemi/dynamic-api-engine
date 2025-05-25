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
    .setDescription(
      'Custom API endpoints with runtime validation. IMPORTANT: You must generate an API key using the /config/api-key endpoint before you can execute any dynamic APIs.',
    )
    .setVersion('1.0')
    .addTag(
      'Configuration Management',
      'API configuration and key management endpoints',
    )
    .addTag(
      'Dynamic APIs',
      'Endpoints for dynamic API execution (requires API key)',
    )
    .addTag('Health')
    .addBearerAuth()
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description: 'API key generated from /config/api-key endpoint',
      },
      'x-api-key',
    )
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

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is now running on port ${port}`);
  console.log(`Swagger docs is running at: /api-docs`);
}
bootstrap();
