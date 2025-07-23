import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { AuthService } from 'src/auth/auth.service';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/user/entity/user.entity';
import { ChatEntity } from './entity/chat.entity';
import { ChatRoomEntity } from './entity/chat-room.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, ChatEntity, ChatRoomEntity]),
    AuthModule,
    UserModule,
  ],
  providers: [ChatGateway, ChatService, AuthService],
})
export class ChatModule {}
