import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { catchError, concatMap, from, Observable } from 'rxjs';
import { DataSource, QueryRunner } from 'typeorm';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    const req: Request & { queryRunner: QueryRunner } = context
      .switchToHttp()
      .getRequest();

    const qr = this.dataSource.createQueryRunner();

    await qr.connect();
    await qr.startTransaction();

    req.queryRunner = qr;

    // tap 대신 concatMap사용 (비동기 콜백함수를 사용해도 타입에러 없음)
    // catchError를 pipe마지막에 넣음
    // 이렇게 해도 next.handle()에서 Observable로 래핑된 error가 넘어와도 concatMap이 실행되지 않고, 바로 catchError가 실행됨.
    // 덤으로 db부하가 심할떄, transaction완료가 timeover날수도 있는 에러도 catchError에서 핸들링 가능함
    return next.handle().pipe(
      concatMap(async (value: unknown) => {
        await qr.commitTransaction(); // 여기서 error가 나면 아래 qr.relase가 실행되지않고 catchError로 바로 넘어감
        await qr.release();

        return value;
      }),
      catchError((error) => {
        return from(
          (async () => {
            await qr.rollbackTransaction(); // 여기서 error가 나면 qr.release가 실행되지않고 error가 throw됨
            await qr.release();
            throw error;
          })(),
        );
      }),
    );
  }
}
