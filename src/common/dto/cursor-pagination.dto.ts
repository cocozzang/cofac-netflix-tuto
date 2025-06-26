import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';

export class CursorPaginationDto {
  @ApiProperty({
    description: '페이지네이션 커서',
    example: 'eyJ2YWx1ZXMiOnsiaWQiOjR9LCJvcmRlciI6WyJpZF9ERVNDIl19',
  })
  @IsString()
  @IsOptional()
  cursor?: string;

  @ApiProperty({
    description: '내림차 또는 오름차 정렬',
    examples: {
      asc: {
        summary: 'ASC',
        description: 'id_ASC',
        value: ['id_ASC'],
      },
      desc: {
        summary: 'DESC',
        description: 'id_DESC',
        value: ['id_DESC'],
      },
    },
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value) ? (value as string[]) : [value as string],
  )
  // ["likeCount_DESC", "id_DESC]
  order: string[] = ['id_DESC'];

  @ApiProperty({
    description: '가져올 데이터 갯수',
    example: 5,
  })
  @IsInt()
  @IsOptional()
  take: number = 5;
}
