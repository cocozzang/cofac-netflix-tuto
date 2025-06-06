import { Exclude } from 'class-transformer';
import { BaseModelEntity } from 'src/common/entity/base-model.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum RoleEnum {
  admin,
  paidUser,
  user,
}

@Entity('user')
export class UserEntity extends BaseModelEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true,
  })
  email: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  password: string;

  @Column({ enum: RoleEnum, default: RoleEnum.user })
  role: RoleEnum;
}
