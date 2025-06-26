import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './strategy/local.strategy';
import { JwtAuthGuard, JwtPayloadInterface } from './strategy/jwt.strategy';
import { Request } from 'express';
import { Public } from './decorator/public.decorator';
import { ApiBasicAuth, ApiBearerAuth } from '@nestjs/swagger';
import { Authorization } from './decorator/authorization.decorator';

@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiBasicAuth()
  @Public()
  @Post('register')
  registerUser(@Authorization() token: string) {
    return this.authService.register(token);
  }

  @ApiBasicAuth()
  @Public()
  @Post('login')
  loginUser(@Authorization() token: string) {
    return this.authService.login(token);
  }

  @Post('token/block')
  blockToken(@Body('token') token: string) {
    return this.authService.tokenBlock(token);
  }

  @Public()
  @Post('token/access')
  async rotateAccessToken(@Req() req: Request) {
    const user = req.user as JwtPayloadInterface;

    return {
      accessToken: await this.authService.issueToken(user, false),
    };
  }

  @UseGuards(LocalAuthGuard)
  @Post('login/passport')
  async loginUserPassport(@Req() req: Express.Request) {
    const { sub, role } = req.user as JwtPayloadInterface;

    return {
      refreshToken: await this.authService.issueToken({ sub, role }, true),
      accessToken: await this.authService.issueToken({ sub, role }, false),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('private')
  private(@Req() req: Express.Request) {
    return req.user;
  }
}
