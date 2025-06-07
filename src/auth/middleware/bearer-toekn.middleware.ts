import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { envVariableKeys } from 'src/common/const/env.const';
import { JwtPayloadInterface } from '../strategy/jwt.strategy';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BearerTokenMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      next();
      return;
    }

    try {
      const token = this.validateBearerToken(authHeader);

      const decodedPayload: JwtPayloadInterface = this.jwtService.decode(token);

      if (
        decodedPayload.type !== 'refresh' &&
        decodedPayload.type !== 'access'
      ) {
        throw new UnauthorizedException('토큰 포맷이 유효하지 않습니다.');
      }

      const payload: JwtPayloadInterface = await this.jwtService.verifyAsync(
        token,
        {
          secret:
            decodedPayload.type === 'refresh'
              ? this.configService.get<string>(
                  envVariableKeys.refreshTokenSecret,
                )
              : this.configService.get<string>(
                  envVariableKeys.accessTokenSecret,
                ),
        },
      );

      req.user = payload;

      next();
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('token이 만료되었습니다.');
      }

      next();
    }
  }

  validateBearerToken(rawToken: string) {
    const basicSplit = rawToken.split(' ');

    if (basicSplit.length !== 2)
      throw new UnauthorizedException('토큰 포맷이 유효하지 않습니다.');

    const [bearer, token] = basicSplit;

    if (bearer.toLowerCase() !== 'bearer')
      throw new UnauthorizedException('토큰 포맷이 유효하지 않습니다.');

    return token;
  }
}
