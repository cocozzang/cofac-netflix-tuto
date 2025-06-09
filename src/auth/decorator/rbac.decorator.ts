import { Reflector } from '@nestjs/core';
import { RoleEnum } from 'src/user/entity/user.entity';

export const RBAC = Reflector.createDecorator<RoleEnum>();
