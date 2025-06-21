import { JwtPayloadInterface } from 'src/auth/strategy/jwt.strategy';

export type AuthUser = JwtPayloadInterface;

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends AuthUser {}

    interface Request {
      user?: User;
    }
  }
}
