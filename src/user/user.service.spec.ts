import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from './entity/user.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const mockUserRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockConfigService = { get: jest.fn() };

describe('UserService', () => {
  let userService: UserService;
  let userServiceAny: any; // private 메서드 접근용

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    userServiceAny = userService as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [
        {
          id: 1,
          email: 'coco@coco.com',
        },
      ];

      mockUserRepository.find.mockResolvedValue(users);

      const result = await userService.findAll();

      expect(result).toEqual(users);
      expect(mockUserRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const user = { id: 1, email: 'test@test.com' };

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(user);

      const result = await userService.findOne(1);

      expect(result).toEqual(user);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw a NotFoundException if user is not found', async () => {
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

      await expect(userService.findOne(99)).rejects.toThrow(NotFoundException);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 99 },
      });
    });
  });

  describe('remove', () => {
    const userId = 1;
    const notExistingUser = 99;

    it('should remove a user by id', async () => {
      jest.spyOn(mockUserRepository, 'delete').mockResolvedValue(userId);

      const result = await userService.remove(userId);

      expect(result).toBe(userId);
      expect(mockUserRepository.delete).toHaveBeenCalledWith(userId);
    });

    it('should throw a NotFoundException if user is not found', async () => {
      jest
        .spyOn(mockUserRepository, 'delete')
        .mockResolvedValue({ affected: 0 });

      await expect(userService.remove(notExistingUser)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockUserRepository.delete).toHaveBeenCalledWith(notExistingUser);
    });
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@test.com',
      password: '123123',
    };

    const hashedPassword = 'test-hash-password';

    it('should create a user and return it', async () => {
      const result = {
        id: 1,
        email: createUserDto.email,
        password: hashedPassword,
      };

      const getHashedPasswordSpy = jest
        .spyOn(userServiceAny, 'getHashedPassword')
        .mockResolvedValue(hashedPassword);

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce(null);

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce(result);

      const createdUser = await userService.create(createUserDto);

      expect(createdUser).toEqual(result);
      expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(1, {
        where: { email: createUserDto.email },
      });
      expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(2, {
        where: { email: createUserDto.email },
      });
      expect(getHashedPasswordSpy).toHaveBeenCalledWith(createUserDto.password);
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        email: createUserDto.email,
        password: hashedPassword,
      });
    });

    it('should throw ConflictException if email already been taken', async () => {
      jest
        .spyOn(mockUserRepository, 'findOne')
        .mockResolvedValueOnce({ id: 1, email: createUserDto.email });

      await expect(userService.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
    });
  });

  describe('update', () => {
    const userId = 1;
    const updateUserDto: UpdateUserDto = {
      email: 'editedtest@test.com',
      password: '123123!@',
    };
    const updateUserDtoWithoutPassword = {
      email: 'editedtest@test.com',
    };

    const hashedPassword = 'test-hash-password';

    it('should success to update user info, then return the user data has been updated', async () => {
      const getHashedPasswordSpy = jest
        .spyOn(userServiceAny, 'getHashedPassword')
        .mockResolvedValue(hashedPassword);

      jest
        .spyOn(mockUserRepository, 'update')
        .mockResolvedValueOnce({ affected: 1 });

      jest
        .spyOn(mockUserRepository, 'findOne')
        .mockResolvedValue({ ...updateUserDto, password: hashedPassword });

      const updatedUser = await userService.update(userId, updateUserDto);

      expect(updatedUser).toEqual({
        ...updateUserDto,
        password: hashedPassword,
      });

      expect(getHashedPasswordSpy).toHaveBeenCalledWith(updateUserDto.password);
    });

    it('should success to update user info without password, then return the user data has been updated', async () => {
      const getHashedPasswordSpy = jest
        .spyOn(userServiceAny, 'getHashedPassword')
        .mockResolvedValue(hashedPassword);

      jest
        .spyOn(mockUserRepository, 'update')
        .mockResolvedValueOnce({ affected: 1 });

      jest
        .spyOn(mockUserRepository, 'findOne')
        .mockResolvedValue({ ...updateUserDtoWithoutPassword });

      const updatedUser = await userService.update(
        userId,
        updateUserDtoWithoutPassword,
      );

      expect(updatedUser).toEqual({
        ...updateUserDtoWithoutPassword,
      });

      expect(getHashedPasswordSpy).not.toHaveBeenCalled();
    });

    it('should throw a NotFoundException. if a user to update is not found', async () => {
      const getHashedPasswordSpy = jest
        .spyOn(userServiceAny, 'getHashedPassword')
        .mockResolvedValue(hashedPassword);

      jest
        .spyOn(mockUserRepository, 'update')
        .mockResolvedValueOnce({ affected: 0 });

      await expect(userService.update(userId, updateUserDto)).rejects.toThrow(
        NotFoundException,
      );

      expect(getHashedPasswordSpy).toHaveBeenCalledWith(updateUserDto.password);
    });
  });
});
