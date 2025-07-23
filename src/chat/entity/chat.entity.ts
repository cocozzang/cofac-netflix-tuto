import { BaseModelEntity } from 'src/common/entity/base-model.entity';
import { UserEntity } from 'src/user/entity/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ChatRoomEntity } from './chat-room.entity';

@Entity('chat')
export class ChatEntity extends BaseModelEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, (user) => user.chats)
  author: UserEntity;

  @Column()
  message: string;

  @ManyToOne(() => ChatRoomEntity, (chatRoom) => chatRoom.chats)
  chatRoom: ChatRoomEntity;
}
