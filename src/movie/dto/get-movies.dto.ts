import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CursorPaginationDto } from 'src/common/dto/cursor-pagination.dto';

export class GetMoviesDto extends CursorPaginationDto {
  @ApiProperty({ description: '영화의 제목', example: '해리포터' })
  @IsString()
  @IsOptional()
  title?: string;
}
