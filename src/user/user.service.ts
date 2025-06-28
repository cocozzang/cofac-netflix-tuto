import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entity/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { envVariableKeys } from 'src/common/const/env.const';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly configService: ConfigService,
  ) {}
  private async getHashedPassword(password: string) {
    const hashedPassword = await bcrypt.hash(
      password,
      this.configService.get<number>(envVariableKeys.hashRounds) as number,
    );

    return hashedPassword;
  }

  async create(createUserDto: CreateUserDto) {
    const { email, password } = createUserDto;

    const user = await this.userRepository.findOne({ where: { email } });

    if (user) {
      throw new ConflictException('이미 사용중인 이메일 입니다.');
    }

    const hashPassword = await this.getHashedPassword(password);

    await this.userRepository.save({ email, password: hashPassword });

    return this.userRepository.findOne({
      where: { email },
    });
  }

  findAll() {
    return this.userRepository.find();
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('존재하지 않는 사용자입니다.');
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const { password } = updateUserDto;

    const hashPassword = password && (await this.getHashedPassword(password));

    const updateResult = await this.userRepository.update(
      { id },
      { ...updateUserDto, password: hashPassword },
    );

    if (updateResult.affected === 0)
      throw new NotFoundException('존재하지 않는 사용자입니다.');

    const newUser = await this.userRepository.findOne({ where: { id } });

    return newUser;
  }

  async remove(id: number) {
    const deleteResult = await this.userRepository.delete(id);

    if (deleteResult.affected === 0) {
      throw new NotFoundException(
        '삭제하려는 id의 리소스는 존재하지 않습니다.',
      );
    }

    return id;
  }
}
