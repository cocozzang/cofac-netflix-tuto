import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { MovieModule } from './movie/movie.module';
import { ConditionalModule, ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';
import { MovieEntity } from './movie/entity/movie.entity';
import { MovieDetailEntity } from './movie/entity/movie-detail.entity';
import { DirectorModule } from './director/director.module';
import { DirectorEntity } from './director/entity/director.entity';
import { GenreModule } from './genre/genre.module';
import { GenreEntity } from './genre/entity/genre.entity';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { UserEntity } from './user/entity/user.entity';
import { envVariableKeys } from './common/const/env.const';
import { BearerTokenMiddleware } from './auth/middleware/bearer-token.middleware';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthGuard } from './auth/guard/auth.guard';
import { RBACGuard } from './auth/guard/rbac.guard';
import { CommonModule } from './common/common.module';
import { QueryFailedExceptionFilter } from './common/filter/query-failed.filter';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { MovieUserLikeEntity } from './movie/entity/movie-user-like.entity';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottleInterceptor } from './common/interceptor/throttle.interceptor';
import { ScheduleModule } from '@nestjs/schedule';
import { WinstonModule } from 'nest-winston';
import { ChatModule } from './chat/chat.module';
import * as winston from 'winston';
import { ChatRoomEntity } from './chat/entity/chat-room.entity';
import { ChatEntity } from './chat/entity/chat.entity';
import { WorkerModule } from './worker/worker.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV
        ? `.env.${process.env.NODE_ENV}`
        : '.env.dev',
      validationSchema: Joi.object({
        ENV: Joi.string().valid('test', 'dev', 'prod').required(),
        DB_TYPE: Joi.string().valid('postgres').required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        HASH_ROUNDS: Joi.number().required(),
        ...(process.env.NODE_ENV === 'prod' && {
          ACCESS_TOKEN_SECRET: Joi.string().required(),
          REFRESH_TOKEN_SECRET: Joi.string().required(),
          AWS_SECRET_ACCESS_KEY: Joi.string().required(),
          AWS_ACCESS_KEY_ID: Joi.string().required(),
          AWS_REGION: Joi.string().required(),
          BUCKET_NAME: Joi.string().required(),
        }),
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: configService.get<string>(envVariableKeys.dbType) as 'postgres',
        host: configService.get<string>(envVariableKeys.dbHost),
        port: configService.get<number>(envVariableKeys.dbPort),
        username: configService.get<string>(envVariableKeys.dbUsername),
        password: configService.get<string>(envVariableKeys.dbPassword),
        database: configService.get<string>(envVariableKeys.dbDatabase),
        entities: [
          MovieEntity,
          MovieDetailEntity,
          DirectorEntity,
          GenreEntity,
          UserEntity,
          MovieUserLikeEntity,
          ChatEntity,
          ChatRoomEntity,
        ],
        synchronize:
          configService.get<string>(envVariableKeys.env) === 'prod'
            ? false
            : true,
        ...(configService.get<string>(envVariableKeys.env) === 'prod' && {
          ssl: {
            rejectUnauthorized: false,
          },
        }),
      }),
    }),
    CommonModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      serveRoot: '/public/',
    }),
    CacheModule.register({
      ttl: 10 * 1000, // 10 seconds
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    WinstonModule.forRoot({
      level: 'debug',
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize({ all: true }),
            winston.format.timestamp(),
            winston.format.printf(
              (info) =>
                `${info.timestamp as string} [${info.context as string}] ${info.level} ${info.message as string}`,
            ),
          ),
        }),
        new winston.transports.File({
          dirname: join(process.cwd(), 'logs'),
          filename: 'logs.log',
          format: winston.format.combine(
            // winston.format.colorize({ all: true }),
            winston.format.timestamp(),
            winston.format.printf(
              (info) =>
                `${info.timestamp as string} [${info.context as string}] ${info.level} ${info.message as string}`,
            ),
          ),
        }),
      ],
    }),
    MovieModule,
    DirectorModule,
    GenreModule,
    AuthModule,
    UserModule,
    ChatModule,
    ConditionalModule.registerWhen(
      WorkerModule,
      (env) => env['TYPE'] === 'worker',
    ),
  ],

  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RBACGuard,
    },
    // 개발시엔 디버깅을 위해 꺼둡시다.
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: ResponseTimeInterceptor,
    // },
    { provide: APP_FILTER, useClass: QueryFailedExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ThrottleInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(BearerTokenMiddleware)
      .exclude(
        { path: 'auth/login', method: RequestMethod.POST },
        {
          path: 'auth/register',
          method: RequestMethod.POST,
        },
      )
      .forRoutes('*');
  }
}
