import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const clientUrl = configService.get<string>('CLIENT_URL');
  const globalPrefix = 'api';

  app.enableCors({
    origin: clientUrl ?? 'http://localhost:3001',
    credentials: true,
  });

  app.setGlobalPrefix(globalPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Car service center')
    .setDescription('API for managing car service center workflows')
    .setVersion('0.1')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(globalPrefix, app, document);

  app.use(cookieParser());

  const PORT = process.env.PORT ?? 3000;
  await app.listen(PORT, () => {
    Logger.log(`API is running at http://localhost:${PORT}/api`, 'Main');
  });
}
bootstrap();
