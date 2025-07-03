import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RoleEnum, UserEntity } from 'src/user/entity/user.entity';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Repository } from 'typeorm';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtPayloadInterface } from './strategy/jwt.strategy';
import * as bcrypt from 'bcrypt';

const mockUserRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};
const mockUserService = {
  create: jest.fn(),
  getHashedPassword: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};
const mockConfigService = { get: jest.fn() };

const mockJwtService = {
  signAsync: jest.fn(),
  verifyAsync: jest.fn(),
  decode: jest.fn(),
};

const mockCacheManager = {
  set: jest.fn(),
  get: jest.fn(),
};

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: Repository<UserEntity>;
  let configService: ConfigService;
  let jwtService: JwtService;
  let cacheManager: Cache;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        { provide: JwtService, useValue: mockJwtService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
    configService = module.get<ConfigService>(ConfigService);
    jwtService = module.get<JwtService>(JwtService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
    userService = module.get<UserService>(UserService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(authService).toBeDefined();
    expect(userService).toBeDefined();
    expect(configService).toBeDefined();
    expect(userRepository).toBeDefined();
    expect(jwtService).toBeDefined();
    expect(cacheManager).toBeDefined();
  });

  describe('tokenBlock', () => {
    it('should block a token', async () => {
      const token = 'token';
      const payload = {
        exp: Math.floor(Date.now() / 1000) + 60,
      };

      const jwtServiceDecodeSpy = jest
        .spyOn(jwtService, 'decode')
        .mockReturnValue(payload);

      await authService.tokenBlock(token);

      expect(jwtServiceDecodeSpy).toHaveBeenCalledWith(token);
      expect(cacheManager.set).toHaveBeenCalledWith(
        `BLOCK_TOKEN_${token}`,
        payload,
        expect.any(Number),
      );
      await expect(authService.tokenBlock(token)).resolves.toBe(true);
    });
  });

  describe('parseBasicToken', () => {
    it('should parse a valid Basic Token', () => {
      const rawToken = 'Basic dGVzdEB0ZXN0LmNvbToxMjMxMjM=';
      const result = authService.parseBasicToken(rawToken);

      const decode = { email: 'test@test.com', password: '123123' };

      expect(result).toEqual(decode);
    });

    it('should throw UnauthorizedException, when recieve invalid Basic Token', () => {
      const invalidToken1 = 'dGVzdEB0ZXN0LmNvbToxMjMxMjM=';
      const invalidToken2 = 'Basik dGVzdEB0ZXN0LmNvbToxMjMxMjM=';
      const invalidToken3 = Buffer.from('invalid-credential-data').toString(
        'base64',
      );

      expect(() => authService.parseBasicToken(invalidToken1)).toThrow(
        UnauthorizedException,
      );

      expect(() => authService.parseBasicToken(invalidToken2)).toThrow(
        UnauthorizedException,
      );

      expect(() => authService.parseBasicToken(invalidToken3)).toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('parseBearerToken', () => {
    it('should return JwtPayloadInterface. after parse a valid Bearer Token', async () => {
      const rawToken = 'Bearer accesstoken';
      const accessTokenSecret = 'test-secret';
      const payload: JwtPayloadInterface = {
        sub: 1,
        role: RoleEnum.user,
        type: 'access',
      };

      jest.spyOn(configService, 'get').mockReturnValue(accessTokenSecret);
      const jwtServiceSpy = jest
        .spyOn(jwtService, 'verifyAsync')
        .mockResolvedValue(payload);

      const result = await authService.parseBearerToken(rawToken, false);

      expect(jwtServiceSpy).toHaveBeenCalledWith('accesstoken', {
        secret: accessTokenSecret,
      });
      expect(result).toEqual(payload);
    });

    it('should throw UnauthorizedException, when recieve invalid token', async () => {
      const invalidToken1 = 'BearerAccessToken';
      const invalidToken2 = 'BearerCoco AccessToken';

      await expect(
        authService.parseBearerToken(invalidToken1, false),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        authService.parseBearerToken(invalidToken2, false),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException, when does not match token type', async () => {
      const payloadWithAccessToken: JwtPayloadInterface = {
        role: RoleEnum.user,
        sub: 1,
        type: 'access',
      };
      const payloadWithRefreshToken: JwtPayloadInterface = {
        role: RoleEnum.user,
        sub: 1,
        type: 'refresh',
      };
      const rawToken = 'Bearer access-token';

      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockResolvedValueOnce({ payloadWithAccessToken });

      await expect(
        authService.parseBearerToken(rawToken, true),
      ).rejects.toThrow(BadRequestException);

      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockResolvedValueOnce({ payloadWithRefreshToken });

      await expect(
        authService.parseBearerToken(rawToken, false),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException, when token was expired', async () => {
      const token = 'Bearer AccessToken';
      const tokenExpiredError = new Error('jwt expired');
      tokenExpiredError.name = 'TokenExpiredError';

      const jwtserviceSpy = jest
        .spyOn(jwtService, 'verifyAsync')
        .mockRejectedValue(tokenExpiredError);
      jest.spyOn(configService, 'get').mockReturnValue('access-token-secret');

      await expect(authService.parseBearerToken(token, false)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtserviceSpy).toHaveBeenCalledWith(token.split(' ')[1], {
        secret: 'access-token-secret',
      });
    });
  });

  describe('register', () => {
    it('should return UserEntity, after registe new user', async () => {
      const rawToken = 'Basic token';
      const newUser = {
        email: 'test@test.com',
        password: 'test-password',
      };

      const parseBasicTokenSpy = jest
        .spyOn(authService, 'parseBasicToken')
        .mockReturnValue(newUser);
      const mockUserServiceCreateSpy = jest
        .spyOn(mockUserService, 'create')
        .mockResolvedValue(newUser);

      const result = await authService.register(rawToken);

      expect(parseBasicTokenSpy).toHaveBeenCalledWith(rawToken);
      expect(mockUserServiceCreateSpy).toHaveBeenCalledWith(newUser);

      expect(result).toEqual(newUser);
    });
  });

  describe('authenticate', () => {
    const email = 'test@test.com';
    const password = 'test-password';
    const user = { email, password: 'hashedpassword' };
    const mockBcryptCompare = bcrypt.compare as jest.Mock;

    it('should authenticate a user with correct credentials', async () => {
      const mockUserRepositorySpy = jest
        .spyOn(mockUserRepository, 'findOne')
        .mockResolvedValue(user);
      mockBcryptCompare.mockResolvedValue(true);

      const result = await authService.authenticate(email, password);

      expect(mockUserRepositorySpy).toHaveBeenCalledWith({ where: { email } });
      expect(mockBcryptCompare).toHaveBeenCalledWith(password, user.password);
      expect(result).toEqual(user);
    });

    it('should throw error for not existing user', async () => {
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

      await expect(authService.authenticate(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw error for wrong password', async () => {
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);
      mockBcryptCompare.mockResolvedValue(false);

      await expect(authService.authenticate(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('issueToken', () => {
    let mockJwtServiceSpy: jest.SpyInstance;

    beforeEach(() => {
      jest.spyOn(mockConfigService, 'get').mockReturnValue('secret');

      mockJwtServiceSpy = jest
        .spyOn(mockJwtService, 'signAsync')
        .mockResolvedValue(token);
    });

    const user = { sub: 1, role: RoleEnum.user };
    const token = 'token';

    it('should issue access token', async () => {
      const result = await authService.issueToken(user, false);
      expect(mockJwtServiceSpy).toHaveBeenCalledWith(
        {
          ...user,
          type: 'access',
        },
        { secret: 'secret', expiresIn: '1d' },
      );

      expect(result).toBe(token);
    });

    it('should issue refresh token', async () => {
      const result = await authService.issueToken(user, true);
      expect(mockJwtServiceSpy).toHaveBeenCalledWith(
        {
          ...user,
          type: 'refresh',
        },
        { secret: 'secret', expiresIn: '7d' },
      );

      expect(result).toBe(token);
    });
  });

  describe('login', () => {
    const rawToken = 'Basic token';
    const email = 'test@test.com';
    const password = 'test-password';
    const user = { sub: 1, role: RoleEnum.user };

    it('should login a user and return tokens', async () => {
      const authenticateSpy = jest
        .spyOn(authService, 'authenticate')
        // @ts-expect-error for unit test
        .mockResolvedValue(user as UserEntity);

      jest
        .spyOn(authService, 'parseBasicToken')
        .mockReturnValue({ email, password });
      jest.spyOn(authService, 'issueToken').mockResolvedValueOnce('token');

      const result = await authService.login(rawToken);

      expect(result).toEqual({
        accessToken: 'token',
        refreshToken: 'token',
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authService.parseBasicToken).toHaveBeenCalledWith(rawToken);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authService.issueToken).toHaveBeenCalledTimes(2);
      expect(authenticateSpy).toHaveBeenCalledWith(email, password);
    });
  });
});
