import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie, MovieGenre } from './entity/movie.entity';

@Injectable()
export class MovieService {
  private movies: Movie[] = [
    { id: 1, title: '해리포터', genre: MovieGenre.Fantasy },
    { id: 2, title: '스파이더맨', genre: MovieGenre.Action },
  ];

  private idCounter = 2;

  constructor() {
    const movie1 = new Movie();

    movie1.id = 1;
    movie1.title = '해리포터';
    movie1.genre = MovieGenre.Fantasy;

    const movie2 = new Movie();

    movie2.id = 2;
    movie2.title = '스파이더맨';
    movie2.genre = MovieGenre.Action;
  }

  findManyMovies() {
    return this.movies;
  }

  findSearchedMovie(title: string) {
    const searchResult = this.movies.filter((movie) =>
      movie.title.startsWith(title),
    );

    return searchResult;
  }

  findMovie(id: number) {
    const movie = this.movies.find((movie) => movie.id === id);

    if (!movie) {
      throw new NotFoundException('존재하지 않는 id의 영화입니다.');
    }

    return movie;
  }

  createMovie(dto: CreateMovieDto) {
    const movie: Movie = {
      id: ++this.idCounter,
      title: dto.title,
      genre: dto.genre,
    };

    this.movies.push(movie);

    return movie;
  }

  updateMovie(movieId: number, dto: UpdateMovieDto) {
    const movie = this.movies.find((movie) => movie.id === movieId);

    if (!movie) {
      throw new NotFoundException('존재하지 않는 id의 영화입니다.');
    }

    Object.assign(movie, dto);

    return movie;
  }

  removeMovie(id: number) {
    const movie = this.movies.find((movie) => movie.id === +id);

    if (!movie) {
      throw new NotFoundException('존재하지 않는 id의 영화입니다.');
    }

    this.movies = this.movies.filter((movie) => movie.id !== +id);

    return id;
  }
}
