import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request } from 'express';

export const CurrentQueryRunner = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const contextType = context.getType();

    if (contextType !== 'http') {
      throw new InternalServerErrorException(
        `CurrentQueryRunner는 HTTP 컨텍스트에서만 사용할 수 있습니다. route handler decorator를 다시 확인해주세요. 현재 컨텍스트: ${contextType}`,
      );
    }

    const request: Request = context.switchToHttp().getRequest();

    if (!request || !request.queryRunner) {
      throw new InternalServerErrorException(
        'reqeust객체내에서 queryRunner값을 읽을 수 없습니다. Contoller에서 TransactionInterceptor가 적용되었는지 확인해주세요.',
      );
    }

    return request.queryRunner;
  },
);
