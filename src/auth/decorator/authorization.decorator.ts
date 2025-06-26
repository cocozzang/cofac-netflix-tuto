import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const Authorization = createParamDecorator(
  (_: unknown, context: ExecutionContext) => {
    const req: Request = context.switchToHttp().getRequest();

    return req.headers['authorization'];
  },
);
