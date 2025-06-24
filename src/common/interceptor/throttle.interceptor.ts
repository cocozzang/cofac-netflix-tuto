import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { concatMap, Observable } from 'rxjs';
import { Throttle } from '../decorator/throttle.decorator';

@Injectable()
export class ThrottleInterceptor implements NestInterceptor {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    const contextType = context.getType();

    if (contextType !== 'http')
      throw new InternalServerErrorException(
        `CurrentUser는 HTTP 컨텍스트 타입에서만 사용할 수 있습니다. route handler decorator를 다시 확인해주세요. 현재 컨텍스트: ${contextType}`,
      );

    const request: Request = context.switchToHttp().getRequest();

    const userId = request.user?.sub;

    if (!userId) return next.handle();

    const throttleOptions = this.reflector.get<{
      count: number;
      unit: 'minite';
    }>(Throttle, context.getHandler());

    if (!throttleOptions) return next.handle();

    const date = new Date();
    const minute = date.getMinutes();

    const key = `${request.method}_${request.path}_${userId}_${minute}`;

    const count = await this.cacheManager.get<number>(key);

    console.log(key);
    console.log(count);

    if (count && count >= throttleOptions.count)
      throw new ForbiddenException('요청 가능 횟수를 넘어섰습니다.');

    return next.handle().pipe(
      concatMap(async () => {
        const count = (await this.cacheManager.get<number>(key)) ?? 0;

        await this.cacheManager.set(key, count + 1, 60000);
      }),
    );
  }
}
