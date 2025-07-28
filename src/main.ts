import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as ffmpeg from '@ffmpeg-installer/ffmpeg';
import * as ffmpegFluent from 'fluent-ffmpeg';
import * as ffmprobe from 'ffprobe-static';
import * as session from 'express-session';

ffmpegFluent.setFfmpegPath(ffmpeg.path);
ffmpegFluent.setFfprobePath(ffmprobe.path);

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['verbose'],
  });

  const config = new DocumentBuilder()
    .setTitle('coco netflix')
    .setDescription('netflix tutorial')
    .setVersion('1.0')
    .addBasicAuth()
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('doc', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.use(
    session({
      secret: process.env.SESSION_SECRET as string,
      resave: true,
      saveUninitialized: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
