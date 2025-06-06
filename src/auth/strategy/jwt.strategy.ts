import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { envVariableKeys } from 'src/common/const/env.const';
import { RoleEnum } from 'src/user/entity/user.entity';

export interface JwtPayloadInterface {
  sub: number;
  role: RoleEnum;
  type: 'refresh' | 'access';
}

export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        envVariableKeys.accessTokenSecret,
      ) as string,
    });
  }

  validate(payload: JwtPayloadInterface) {
    return payload;
  }
}
