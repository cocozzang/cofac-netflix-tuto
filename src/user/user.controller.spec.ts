import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserEntity } from './entity/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

const mockedUserService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('UserController', () => {
  let userController: UserController;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockedUserService,
        },
      ],
    }).compile();

    userController = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(userController).toBeDefined();
    expect(userService).toBeDefined();
  });

  describe('create', () => {
    it('should return correct value', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@test.com',
        password: 'testpassword',
      };

      const user = {
        id: 1,
        ...createUserDto,
        password: 'hashed-password-djdj',
      };

      const userServiceSpy = jest
        .spyOn(userService, 'create')
        .mockResolvedValue(user as UserEntity);

      const result = await userController.create(createUserDto);

      expect(userServiceSpy).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(user);
    });
  });

  describe('findAll', () => {
    it('should return a list of users', async () => {
      const users = [
        {
          id: 1,
          email: 'test@test.com',
        },
        {
          id: 2,
          email: 'test2@test.com',
        },
      ];

      const userServiceFindAllSpy = jest
        .spyOn(userService, 'findAll')
        .mockResolvedValue(users as UserEntity[]);

      const result = await userController.findAll();

      expect(userServiceFindAllSpy).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe('findOne', () => {
    it('should receive userId, return single user data', async () => {
      const user = {
        id: 1,
        email: 'test@test.com',
      };

      const userServiceFindOneSpy = jest
        .spyOn(userService, 'findOne')
        .mockResolvedValue(user as UserEntity);

      const result = await userController.findOne(user.id);

      expect(userServiceFindOneSpy).toHaveBeenCalledWith(user.id);
      expect(result).toEqual(user);
    });
  });

  describe('update', () => {
    it('should return the updated user', async () => {
      const userId = 1;
      const updateUserDto: UpdateUserDto = {
        email: 'test@test.com',
        password: 'testpassword',
      };
      const user = {
        id: 1,
        email: 'test@test.com',
        password: 'testpassword',
      };

      const userServiceSpy = jest
        .spyOn(userService, 'update')
        .mockResolvedValue(user as UserEntity);

      const result = await userController.update(userId, updateUserDto);

      expect(userServiceSpy).toHaveBeenCalledWith(userId, updateUserDto);
      expect(result).toEqual(user);
    });
  });

  describe('remove', () => {
    it('should run delete user login then return userId', async () => {
      const userId = 1;

      const userServiceSpy = jest
        .spyOn(userService, 'remove')
        .mockResolvedValue(userId);

      const result = await userController.remove(userId);

      expect(userServiceSpy).toHaveBeenCalledWith(userId);
      expect(result).toEqual(userId);
    });
  });
});
