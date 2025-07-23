import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateChatDto {
  @IsString()
  message: string;

  @IsNumber()
  @IsOptional()
  roomId?: number;
}
