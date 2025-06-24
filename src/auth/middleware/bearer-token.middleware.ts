import {
  Inject,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { envVariableKeys } from 'src/common/const/env.const';
import { JwtPayloadInterface } from '../strategy/jwt.strategy';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class BearerTokenMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      next();
      return;
    }

    const token = this.validateBearerToken(authHeader);

    const blockedToken = await this.cacheManager.get(`BLOCK_TOKEN_${token}`);

    if (blockedToken) {
      throw new UnauthorizedException('현재 토큰은 차단된 토큰입니다.');
    }

    const tokenKey = `TOKEN_${token}`;

    const cachedPayload =
      await this.cacheManager.get<JwtPayloadInterface>(tokenKey);

    if (cachedPayload) {
      req.user = cachedPayload;

      return next();
    }

    const decodedPayload: JwtPayloadInterface = this.jwtService.decode(token);

    if (decodedPayload.type !== 'refresh' && decodedPayload.type !== 'access') {
      throw new UnauthorizedException('토큰 포맷이 유효하지 않습니다.');
    }

    try {
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

      const expiryDate = +new Date(payload['exp'] * 1000);
      const now = +Date.now();

      const differenceinSeconds = expiryDate - now / 1000;

      await this.cacheManager.set(
        tokenKey,
        payload,
        Math.max((differenceinSeconds - 30) * 1000, 1),
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
