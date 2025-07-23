import { Socket } from 'socket.io';
import { JwtPayloadInterface } from 'src/auth/strategy/jwt.strategy';
import { QueryRunner } from 'typeorm';

export interface WebSocketClient extends Socket {
  data: {
    user?: JwtPayloadInterface;
    queryRunner?: QueryRunner;
  };
}
