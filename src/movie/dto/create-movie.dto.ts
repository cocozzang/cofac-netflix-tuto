import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export class CreateMovieDto {
  @ApiProperty({
    description: '영화 제목',
    example: '코코의 대모험',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: '영화 설명',
    example: '코코의 지리는 무빙',
  })
  @IsNotEmpty()
  @IsString()
  detail: string;

  @ApiProperty({
    description: '감독 객체 id',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  directorId: number;

  @ApiProperty({
    description: '장르 IDs',
    example: [1, 2, 3],
  })
  @ArrayNotEmpty()
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  genreIds: number[];

  @ApiProperty({
    description:
      '영화 동영상 파일경로 (common/video경로에 POST요청시에 응답받는값)',
    example: '607f94a0-c313-46d6-93cd-ab32b71ccc1c_1750898575804.mp4',
  })
  @IsString()
  movieFileName: string;
}
