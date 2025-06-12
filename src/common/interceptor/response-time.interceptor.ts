import {
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class ResponseTimeInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const req: Request = context.switchToHttp().getRequest();

    const requestTime = Date.now();

    return next.handle().pipe(
      // delay(1000),
      tap(() => {
        const responseTime = Date.now();
        const diff = responseTime - requestTime;

        if (diff > 1000) {
          console.log(`!!! TIMEOUT!!! ${req.method} ${req.path} ${diff}ms`);

          throw new InternalServerErrorException(
            '처리시간이 너무 오래 걸렸습니다!',
          );
        }

        console.log(`${req.method} ${req.path} ${diff}ms`);
      }),
    );
  }
}
