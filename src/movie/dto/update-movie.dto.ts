import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { MovieGenre } from '../entity/movie.entity';

export class UpdateMovieDto {
  @IsNotEmpty()
  @IsOptional()
  @IsString()
  title?: string;

  @IsNotEmpty()
  @IsOptional()
  @IsEnum(MovieGenre)
  genre?: MovieGenre;

  @IsNotEmpty()
  @IsOptional()
  @IsString()
  detail?: string;
}
