import { JwtPayloadInterface } from 'src/auth/strategy/jwt.strategy';
import { QueryRunner } from 'typeorm';
import { Session, SessionData } from 'express-session';

export type AuthUser = JwtPayloadInterface;

declare module 'express-session' {
  interface SessionData {
    movieCount?: Record<number, number>;
  }
}

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends AuthUser {}

    interface Request {
      user?: User;
      queryRunner?: QueryRunner;
      session: Session & Partial<SessionData>;
    }
  }
}
