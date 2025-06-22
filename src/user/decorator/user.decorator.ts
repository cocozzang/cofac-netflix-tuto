import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request } from 'express';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const contextType = context.getType();

    if (contextType !== 'http') {
      throw new InternalServerErrorException(
        `CurrentUser는 HTTP 컨텍스트 타입에서만 사용할 수 있습니다. route handler decorator를 다시 확인해주세요. 현재 컨텍스트: ${contextType}`,
      );
    }

    const request: Request = context.switchToHttp().getRequest();

    return request.user;
  },
);
