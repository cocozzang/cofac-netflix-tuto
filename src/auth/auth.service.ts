import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/user/entity/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  parseBasicToken(rawToken: string) {
    const basicSplit = rawToken.split(' ');

    if (basicSplit.length !== 2)
      throw new BadRequestException('토큰 포맷이 유효하지 않습니다.');

    const [, token] = basicSplit;

    const decoded = Buffer.from(token, 'base64').toString('utf-8');

    const tokenSplit = decoded.split(':');

    if (tokenSplit.length !== 2)
      throw new BadRequestException('토큰 포맷이 유효하지 않습니다.');

    const [email, password] = tokenSplit;

    return { email, password };
  }

  async register(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);

    const user = await this.userRepository.findOne({ where: { email } });

    if (user) {
      throw new ConflictException('이미 사용중인 이메일 입니다.');
    }

    const hash = await bcrypt.hash(
      password,
      this.configService.get<number>('HASH_ROUNDS') as number,
    );

    await this.userRepository.save({ email, password: hash });

    return this.userRepository.findOne({
      where: { email },
    });
  }

  async login(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);

    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('잘못된 로그인 정보입니다.');
    }

    const passOk = await bcrypt.compare(password, user.password);

    if (!passOk) {
      throw new UnauthorizedException('잘못된 로그인 정보입니다.');
    }

    const refreshTokenSecret = this.configService.get<string>(
      'REFRESH_TOKEN_SECRET',
    ) as string;
    const accessTokenSecret = this.configService.get<string>(
      'ACCESS_TOKEN_SECRET',
    ) as string;

    return {
      refreshToken: await this.jwtService.signAsync(
        {
          sub: user.id,
          role: user.role,
          type: 'refresh',
        },
        {
          secret: refreshTokenSecret,
          expiresIn: '7d',
        },
      ),
      accessToken: await this.jwtService.signAsync(
        {
          sub: user.id,
          role: user.role,
          type: 'access',
        },
        {
          secret: accessTokenSecret,
          expiresIn: '1d',
        },
      ),
    };
  }
}
