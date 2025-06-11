import { Transform } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';

export class CursorPaginationDto {
  @IsString()
  @IsOptional()
  cursor?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value) ? (value as string[]) : [value as string],
  )
  // ["likeCount_DESC", "id_DESC]
  order: string[] = ['id_DESC'];

  @IsInt()
  @IsOptional()
  take: number = 5;
}
