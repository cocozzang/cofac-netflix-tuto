import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { JwtPayloadInterface } from '../strategy/jwt.strategy';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req: Request = context.switchToHttp().getRequest();

    const user: JwtPayloadInterface = req.user as JwtPayloadInterface;

    if (!user || user.type !== 'access') {
      return false;
    }

    return true;
  }
}
