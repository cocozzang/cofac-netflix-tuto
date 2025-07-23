import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { WebSocketClient } from 'types/web-socket-client.interface';

export const CurrentWSQueryRunner = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const contextType = context.getType();

    if (contextType !== 'ws') {
      throw new InternalServerErrorException(
        `CurrentWSQueryRunner는 web socket 컨텍스트에서만 사용할 수 있습니다. route handler decorator를 다시 확인해주세요. 현재 컨텍스트: ${contextType}`,
      );
    }

    const client: WebSocketClient = context.switchToWs().getClient();

    if (!client || !client.data.queryRunner) {
      throw new InternalServerErrorException(
        'client객체내에서 queryRunner값을 읽을 수 없습니다. Contoller에서 TransactionInterceptor가 적용되었는지 확인해주세요.',
      );
    }

    return client.data.queryRunner;
  },
);
