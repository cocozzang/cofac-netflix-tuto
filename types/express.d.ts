import { JwtPayloadInterface } from 'src/auth/strategy/jwt.strategy';
import { QueryRunner } from 'typeorm';

export type AuthUser = JwtPayloadInterface;

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends AuthUser {}

    interface Request {
      user?: User;
      queryRunner?: QueryRunner;
    }
  }
}
