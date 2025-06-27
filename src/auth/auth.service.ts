import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/user/entity/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtPayloadInterface } from './strategy/jwt.strategy';
import { envVariableKeys } from 'src/common/const/env.const';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly userService: UserService,
  ) {}

  async tokenBlock(token: string) {
    const payload: JwtPayloadInterface = this.jwtService.decode(token);

    const expiryDate = +new Date(payload['exp'] * 1000);
    const now = +Date.now();

    const differenceinSeconds = expiryDate - now / 1000;

    await this.cacheManager.set(
      `BLOCK_TOKEN_${token}`,
      payload,
      Math.max(differenceinSeconds * 1000, 1),
    );

    return true;
  }

  parseBasicToken(rawToken: string) {
    const basicSplit = rawToken.split(' ');

    if (basicSplit.length !== 2)
      throw new UnauthorizedException('토큰 포맷이 유효하지 않습니다.');

    const [basic, token] = basicSplit;

    if (basic.toLowerCase() !== 'basic')
      throw new UnauthorizedException('토큰 포맷이 유효하지 않습니다.');

    const decoded = Buffer.from(token, 'base64').toString('utf-8');

    const tokenSplit = decoded.split(':');

    if (tokenSplit.length !== 2)
      throw new UnauthorizedException('토큰 포맷이 유효하지 않습니다.');

    const [email, password] = tokenSplit;

    return { email, password };
  }

  async parseBearerToken(rawToken: string, isRefreshToken: boolean) {
    const basicSplit = rawToken.split(' ');

    if (basicSplit.length !== 2)
      throw new UnauthorizedException('토큰 포맷이 유효하지 않습니다.');

    const [bearer, token] = basicSplit;

    if (bearer.toLowerCase() !== 'bearer')
      throw new UnauthorizedException('토큰 포맷이 유효하지 않습니다.');

    try {
      const payload: JwtPayloadInterface = await this.jwtService.verifyAsync(
        token,
        {
          secret: isRefreshToken
            ? this.configService.get<string>(envVariableKeys.refreshTokenSecret)
            : this.configService.get<string>(envVariableKeys.accessTokenSecret),
        },
      );

      if (isRefreshToken && payload.type !== 'refresh')
        throw new UnauthorizedException(
          'payload의 token type이 refresh token이 아닙니다.',
        );

      if (!isRefreshToken && payload.type !== 'access')
        throw new UnauthorizedException(
          'payload의 token type이 access token이 아닙니다.',
        );

      return payload;
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('token이 만료되었습니다.');
      }

      throw error;
    }
  }

  async register(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);

    return this.userService.create({ email, password });
  }

  async authenticate(email: string, password: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('잘못된 로그인 정보입니다.');
    }

    const passOk = await bcrypt.compare(password, user.password);

    if (!passOk) {
      throw new UnauthorizedException('잘못된 로그인 정보입니다.');
    }

    return user;
  }

  async issueToken(
    user: Pick<JwtPayloadInterface, 'sub' | 'role'>,
    isRefreshToken: boolean,
  ) {
    const refreshTokenSecret = this.configService.get<string>(
      envVariableKeys.refreshTokenSecret,
    ) as string;
    const accessTokenSecret = this.configService.get<string>(
      envVariableKeys.accessTokenSecret,
    ) as string;

    const token = await this.jwtService.signAsync(
      {
        sub: user.sub,
        role: user.role,
        type: isRefreshToken ? 'refresh' : 'access',
      },
      {
        secret: isRefreshToken ? refreshTokenSecret : accessTokenSecret,
        expiresIn: isRefreshToken ? '7d' : '1d',
      },
    );

    return token;
  }

  async login(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);

    const user = await this.authenticate(email, password);

    return {
      refreshToken: await this.issueToken(
        { sub: user.id, role: user.role },
        true,
      ),
      accessToken: await this.issueToken(
        { sub: user.id, role: user.role },
        false,
      ),
    };
  }
}
