import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RBAC } from '../decorator/rbac.decorator';
import { Request } from 'express';
import { JwtPayloadInterface } from '../strategy/jwt.strategy';
import { RoleEnum } from 'src/user/entity/user.entity';

@Injectable()
export class RBACGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRole = this.reflector.get<RoleEnum>(
      RBAC,
      context.getHandler(),
    );

    if (!Object.values(RoleEnum).includes(requiredRole)) return true;

    const req: Request = context.switchToHttp().getRequest();

    const user = req.user as JwtPayloadInterface | undefined;

    if (!user)
      throw new InternalServerErrorException(
        '요청유저정보가 없습니다. auth guard가 적용되어야합니다.',
      );

    if (requiredRole < user.role) return false;

    return true;
  }
}
