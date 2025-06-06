import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Headers,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './strategy/local.strategy';
import { UserEntity } from 'src/user/entity/user.entity';
import { JwtAuthGuard } from './strategy/jwt.strategy';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  registerUser(@Headers('authorization') token: string) {
    return this.authService.register(token);
  }

  @Post('login')
  loginUser(@Headers('authorization') token: string) {
    return this.authService.login(token);
  }

  @Post('token/access')
  async rotateAccessToken(@Headers('authorization') token: string) {
    const payload = await this.authService.parseBearerToken(token, true);

    return {
      accessToken: await this.authService.issueToken(
        { id: payload.sub, role: payload.role },
        false,
      ),
    };
  }

  @UseGuards(LocalAuthGuard)
  @Post('login/passport')
  async loginUserPassport(@Req() req: Express.Request) {
    const user = req.user as UserEntity;

    return {
      refreshToken: await this.authService.issueToken(user, true),
      accessToken: await this.authService.issueToken(user, false),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('private')
  private(@Req() req: Express.Request) {
    return req.user;
  }
}
