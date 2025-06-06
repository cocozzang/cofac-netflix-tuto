import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entity/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepositroy: Repository<UserEntity>,
  ) {}

  create(createUserDto: CreateUserDto) {
    return this.userRepositroy.save(createUserDto);
  }

  findAll() {
    return this.userRepositroy.find();
  }

  async findOne(id: number) {
    const user = await this.userRepositroy.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('존재하지 않는 사용자입니다.');
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.userRepositroy.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('존재하지 않는 사용자입니다.');
    }

    await this.userRepositroy.update({ id }, updateUserDto);

    const newUser = await this.userRepositroy.findOne({ where: { id } });

    return newUser;
  }

  async remove(id: number) {
    const deleteResult = await this.userRepositroy.delete(id);

    if (deleteResult.affected === 0) {
      throw new NotFoundException(
        '삭제하려는 id의 리소스는 존재하지 않습니다.',
      );
    }

    return id;
  }
}
