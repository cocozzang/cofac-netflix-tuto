import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { MovieGenre } from '../entity/movie.entity';

export class CreateMovieDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsEnum(MovieGenre)
  genre: MovieGenre;
}
