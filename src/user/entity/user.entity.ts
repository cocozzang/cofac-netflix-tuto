import { Exclude, Type } from 'class-transformer';
import { ChatRoomEntity } from 'src/chat/entity/chat-room.entity';
import { ChatEntity } from 'src/chat/entity/chat.entity';
import { BaseModelEntity } from 'src/common/entity/base-model.entity';
import { MovieUserLikeEntity } from 'src/movie/entity/movie-user-like.entity';
import { MovieEntity } from 'src/movie/entity/movie.entity';
import {
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

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

  @OneToMany(() => MovieEntity, (movie) => movie.creator)
  @Type(() => MovieEntity)
  createdMovies: MovieEntity[];

  @OneToMany(() => MovieUserLikeEntity, (mul) => mul.user)
  likedMovies: MovieUserLikeEntity[];

  @OneToMany(() => ChatEntity, (chat) => chat.author)
  chats: ChatEntity[];

  @ManyToMany(() => ChatRoomEntity, (chatroom) => chatroom.users)
  chatRooms: ChatRoomEntity[];
}
