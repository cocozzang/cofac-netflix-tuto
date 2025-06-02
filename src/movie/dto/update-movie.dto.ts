import { IsEnum, IsOptional, IsString } from 'class-validator';
import { MovieGenre } from '../entity/movie.entity';

export class UpdateMovieDto {
  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsEnum(MovieGenre)
  genre: MovieGenre;
}
