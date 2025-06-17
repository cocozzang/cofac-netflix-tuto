import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { catchError, concatMap, from, Observable } from 'rxjs';
import { DataSource, QueryRunner } from 'typeorm';

/**
 * DB 에러의 공통 속성을 정의하는 인터페이스
 */
interface DatabaseError {
  message?: string;
  code?: string;
  errno?: number;
  sqlState?: string;
  sqlMessage?: string;
}

/**
 * 기존 TransactionInterceptor는 qr.release()가 qr.transaction() 또는 qr.rollbackTransaction()이 완료되고 난 이후에 실행되게 된다.
 * 이는 DB connection을 해제하는 것이 DB 가용성 확보에 의존하는 상태가 된다고 볼 수 있다.
 * 기존 코드는 DB가용성이 충분하지 않은 상황에서 transaction commit시에 timeout error가 난다면
 * 매우 높은 확률로 rollback 또한 되지않을 것이고 db connect release 또한 실행되지 않아서, 일정시간 동안 해당 db connection이 lock상태에 빠지게 만든다.
 * 해당 lock이 DB가용성을 더 줄어들게 만들어 시스템안정성 악화를 더욱 가속시키게 된다.
 * 이에 대한 해결책으로,
 * 1. qr.release()는 무엇에도 의존하지 않고 반드시 실행되게 만들기.
 * 2. DB 가용성 관련 error를 따로 캡쳐링하여 rollback하지 않고 바로 release되게 만들기
 *
 * 2에 대한 부연 설명 :
 * commit시에 가용성문제로 실패한다면 rollback 또한 마찬가지로 가용성 부족으로 인해 실행되기 어려운 상태일 것이다.
 * rollback(데이터 정합성) 자체가 시스템안정성에 의존하는 상황이므로,
 * 가용성문제가 발생한다면 개별 데이터의 정합성을 포기하고 시스템 안정성을 최우선순위로 두는 것이,
 * 전체 데이터 정합성 확보에 더 도움이 된다고 판단하였다.
 */
@Injectable()
export class TransactionEnhancedInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TransactionEnhancedInterceptor.name);

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

    return next.handle().pipe(
      concatMap(async (value: unknown) => {
        try {
          await qr.commitTransaction();
          this.logger.debug('Transaction committed successfully');
          return value;
        } catch (commitError) {
          this.logger.error('Commit failed:', commitError);

          // 🔥 핵심: 에러 타입에 따른 차별적 처리
          if (this.isDBAvailabilityError(commitError)) {
            this.logger.warn(
              'DB availability issue detected - skipping rollback for system stability',
            );
            // 가용성 문제 → 즉시 release (rollback 생략)
          } else {
            // 비즈니스 에러 → rollback 시도
            try {
              await qr.rollbackTransaction();
              this.logger.debug('Rollback completed after commit failure');
            } catch (rollbackError) {
              this.logger.error('Rollback also failed:', rollbackError);
            }
          }
          throw commitError;
        } finally {
          await this.safeRelease(qr);
        }
      }),

      catchError((error: unknown) => {
        return from(
          (async () => {
            // next.handle()에서 온 에러만 롤백 처리
            if (this.isDBAvailabilityError(error)) {
              this.logger.warn('DB availability issue - skipping rollback');
            } else {
              try {
                await qr.rollbackTransaction();
                this.logger.debug('Transaction rolled back successfully');
              } catch (rollbackError) {
                this.logger.error('Rollback failed:', rollbackError);
              }
            }

            await this.safeRelease(qr);
            throw error;
          })(),
        );
      }),
    );
  }

  /**
   * DB 가용성 관련 에러인지 판단
   */
  private isDBAvailabilityError(error: unknown): boolean {
    // 타입 가드를 통한 안전한 타입 체크
    if (!error || typeof error !== 'object') {
      return false;
    }

    const dbError = error as DatabaseError;
    const errorMessage = dbError.message?.toLowerCase() || '';
    const errorCode = dbError.code || '';

    // 타임아웃 관련
    if (errorMessage.includes('timeout')) return true;
    if (errorMessage.includes('lock wait timeout')) return true;
    if (errorCode === 'ER_LOCK_WAIT_TIMEOUT') return true;

    // 커넥션 관련
    if (errorMessage.includes('connection')) return true;
    if (errorMessage.includes('pool')) return true;
    if (errorCode === 'ECONNRESET') return true;
    if (errorCode === 'ENOTFOUND') return true;

    // 데드락
    if (errorMessage.includes('deadlock')) return true;
    if (errorCode === 'ER_LOCK_DEADLOCK') return true;

    return false;
  }

  /**
   * 안전한 커넥션 해제
   */
  private async safeRelease(qr: QueryRunner): Promise<void> {
    try {
      await qr.release();
      this.logger.debug('Connection released successfully');
    } catch (releaseError) {
      this.logger.error('Connection release failed:', releaseError);
      // release 실패해도 예외 던지지 않음
    }
  }
}
