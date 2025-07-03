/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RoleEnum, UserEntity } from 'src/user/entity/user.entity';
import { Request } from 'express';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  tokenBlock: jest.fn(),
  issueToken: jest.fn(),
};

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('register user', () => {
    it('should register a user', async () => {
      const token = 'Basic dummytoken';
      const result = { id: 1, email: 'test@test.com' };

      jest
        .spyOn(authService, 'register')
        .mockResolvedValue(result as UserEntity);

      await expect(authController.registerUser(token)).resolves.toEqual(result);
      expect(authService.register).toHaveBeenCalledWith(token);
    });
  });

  describe('login user', () => {
    it('should login a user', async () => {
      const token = 'Basic dummytoken';
      const result = {
        refreshToken: 'refreshtoken',
        accessToken: 'accesstoken',
      };

      jest.spyOn(authService, 'login').mockResolvedValue(result);

      await expect(authController.loginUser(token)).resolves.toEqual(result);
      expect(authService.login).toHaveBeenCalledWith(token);
    });
  });

  describe('token block', () => {
    it('should block token in request body', async () => {
      jest.spyOn(authService, 'tokenBlock').mockResolvedValue(true);

      await expect(authController.blockToken('token')).resolves.toBe(true);
      expect(authService.tokenBlock).toHaveBeenCalledWith('token');
    });
  });

  describe('rotate access token', () => {
    it('should issue new access token', async () => {
      const accessToken = 'accesstoekn';

      jest.spyOn(authService, 'issueToken').mockResolvedValue(accessToken);

      const result = await authController.rotateAccessToken({
        user: { sub: 1, role: RoleEnum.user, type: 'refresh' },
      } as Request);

      expect(authService.issueToken).toHaveBeenCalledWith(
        { sub: 1, role: RoleEnum.user, type: 'refresh' },
        false,
      );

      expect(result).toEqual({ accessToken });
    });
  });

  describe('loginUserPassport', () => {
    it('should login user with passport strategy ', async () => {
      const user = { sub: 1, role: 'user' };
      const req = { user };
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';

      jest
        .spyOn(authService, 'issueToken')
        .mockResolvedValueOnce(refreshToken)
        .mockResolvedValueOnce(accessToken);

      // @ts-expect-error for unit test
      const result = await authController.loginUserPassport(req);

      expect(authService.issueToken).toHaveBeenCalledTimes(2);
      expect(authService.issueToken).toHaveBeenNthCalledWith(1, user, true);
      expect(authService.issueToken).toHaveBeenNthCalledWith(2, user, false);
      expect(result).toEqual({ refreshToken, accessToken });
    });
  });
});
