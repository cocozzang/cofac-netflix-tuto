import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  ForbiddenException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(ForbiddenException)
export class ForbiddenExceptionFilter implements ExceptionFilter {
  catch(exception: ForbiddenException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response: Response = ctx.getResponse();
    const request: Request = ctx.getRequest();
    const status = exception.getStatus();

    console.log(`[ForbiddenException] ${request.method} ${request.path}`);

    response.status(status).json({
      statusCode: status,
      path: request.url,
      message: '해당 api에 대한 접근권한이 없습니다.',
      timestamp: new Date().toISOString(),
    });
  }
}
