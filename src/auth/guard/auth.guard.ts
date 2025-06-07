import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { JwtPayloadInterface } from '../strategy/jwt.strategy';
import { Reflector } from '@nestjs/core';
import { Public } from '../decorator/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.get(Public, context.getHandler());

    if (isPublic) return true;

    const req: Request = context.switchToHttp().getRequest();

    const user: JwtPayloadInterface = req.user as JwtPayloadInterface;

    if (!user || user.type !== 'access') {
      return false;
    }

    return true;
  }
}
