import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { AuthService } from 'src/auth/auth.service';
import { WebSocketClient } from 'types/web-socket-client.interface';
import { UseInterceptors } from '@nestjs/common';
import { WsTransactionInterceptor } from 'src/common/interceptor/ws-transaction.interceptor';
import { CurrentWSQueryRunner } from 'src/common/decorator/current-ws-query-runner.decorator';
import { QueryRunner } from 'typeorm';
import { CreateChatDto } from './dto/create-chat.dto';
import { JwtPayloadInterface } from 'src/auth/strategy/jwt.strategy';

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly chatService: ChatService,
    private readonly authService: AuthService,
  ) {}
  async handleConnection(client: WebSocketClient) {
    try {
      const rawToken = client.handshake.headers.authorization;

      if (!rawToken) {
        client.disconnect();
        return;
      }

      const payload = await this.authService.parseBearerToken(rawToken, false);

      client.data.user = payload;

      this.chatService.registerClient(payload.sub, client);

      await this.chatService.joinUserRooms(payload, client);
    } catch (error) {
      console.log(error);
      client.disconnect();
    }
  }

  handleDisconnect(client: WebSocketClient) {
    const user = client.data.user;

    this.chatService.removeClient(user!.sub);
  }

  @UseInterceptors(WsTransactionInterceptor)
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() body: CreateChatDto,
    @ConnectedSocket() client: WebSocketClient,
    @CurrentWSQueryRunner() qr: QueryRunner,
  ) {
    const payload = client.data.user as JwtPayloadInterface;

    await this.chatService.createMessage(payload, body, qr);
  }
}
