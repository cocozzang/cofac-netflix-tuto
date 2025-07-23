import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Socket } from 'socket.io';
import { ChatRoomEntity } from './entity/chat-room.entity';
import { QueryRunner, Repository } from 'typeorm';
import { ChatEntity } from './entity/chat.entity';
import { RoleEnum, UserEntity } from 'src/user/entity/user.entity';
import { JwtPayloadInterface } from 'src/auth/strategy/jwt.strategy';
import { CreateChatDto } from './dto/create-chat.dto';
import { WsException } from '@nestjs/websockets';
import { plainToClass } from 'class-transformer';

@Injectable()
export class ChatService {
  private readonly connectedClients = new Map<number, Socket>();

  constructor(
    @InjectRepository(ChatRoomEntity)
    private readonly chatRoomRepository: Repository<ChatRoomEntity>,
    @InjectRepository(ChatEntity)
    private readonly chatRepository: Repository<ChatEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  registerClient(userId: number, client: Socket) {
    this.connectedClients.set(userId, client);
  }

  removeClient(userId: number) {
    this.connectedClients.delete(userId);
  }

  async joinUserRooms(user: { sub: number }, client: Socket) {
    const chatRooms = await this.chatRoomRepository
      .createQueryBuilder('chatRoom')
      .innerJoin('chatRoom.users', 'user', 'user.id = :userId', {
        userId: user.sub,
      })
      .getMany();

    chatRooms.forEach((room) => {
      void client.join(room.id.toString());
    });
  }

  async createMessage(
    payload: JwtPayloadInterface,
    { message, roomId }: CreateChatDto,
    qr: QueryRunner,
  ) {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user)
      throw new WsException(
        `id ${payload.sub}에 해당하는 유저는 존재하지 않습니다.`,
      );

    const chatRoom = (await this.getOrCreateChatRoom(
      user,
      qr,
      roomId,
    )) as ChatRoomEntity;

    const messageModel = await qr.manager.save(ChatEntity, {
      author: user,
      message,
      chatRoom,
    });

    const client = this.connectedClients.get(user.id);

    client!
      .to(chatRoom.id.toString())
      .emit('newMessage', plainToClass(ChatEntity, messageModel));

    return message;
  }

  async getOrCreateChatRoom(
    user: UserEntity,
    qr: QueryRunner,
    roomId?: number,
  ) {
    if (user.role === RoleEnum.admin) {
      if (!roomId) {
        throw new WsException('admin은 room값을 필수로 제공해야합니다.');
      }

      return qr.manager.findOne(ChatRoomEntity, {
        where: { id: roomId },
        relations: ['users'],
      });
    }

    let chatRoom = await qr.manager
      .createQueryBuilder(ChatRoomEntity, 'chatRoom')
      .innerJoin('chatRoom.users', 'user')
      .where('user.id = :userId', { userId: user.id })
      .getOne();

    if (!chatRoom) {
      const adminUser = await qr.manager.findOne(UserEntity, {
        where: { role: RoleEnum.admin },
      });

      if (!adminUser) throw new WsException('admin user가 존재하지 않습니다.');

      chatRoom = await this.chatRoomRepository.save({
        users: [user, adminUser],
      });

      [user.id, adminUser.id].forEach((userId) => {
        const client = this.connectedClients.get(userId);

        if (client) {
          client.emit('roomCreated', chatRoom!.id);
          void client.join(chatRoom!.id.toString());
        }
      });
    }

    return chatRoom;
  }
}
