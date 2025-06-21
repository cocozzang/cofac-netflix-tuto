import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
  UnauthorizedException,
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

    if (!request.user || !request.user.sub) {
      throw new UnauthorizedException('사용자 정보를 찾을 수 없습니다.');
    }

    return request.user;
  },
);
