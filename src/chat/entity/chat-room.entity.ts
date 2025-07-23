import { BaseModelEntity } from 'src/common/entity/base-model.entity';
import { UserEntity } from 'src/user/entity/user.entity';
import {
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChatEntity } from './chat.entity';

@Entity('chat_room')
export class ChatRoomEntity extends BaseModelEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @JoinTable()
  @ManyToMany(() => UserEntity, (user) => user.chatRooms)
  users: UserEntity[];

  @OneToMany(() => ChatEntity, (chat) => chat.chatRoom)
  chats: ChatEntity[];
}
