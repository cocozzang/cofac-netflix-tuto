import { Injectable, NotFoundException } from '@nestjs/common';

export interface Movie {
  id: number;
  title: string;
  character: string[];
}

@Injectable()
export class AppService {
  private movies: Movie[] = [
    { id: 1, title: '해리포터', character: ['해리포터', '간달프'] },
    { id: 2, title: '스파이더맨', character: ['스파이더맨', '이쁜누님'] },
  ];

  private idCounter = 2;

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

  createMovie(title: string, character: string[]) {
    const movie: Movie = {
      id: ++this.idCounter,
      title,
      character,
    };

    this.movies.push(movie);

    return movie;
  }

  updateMovie(id: number, title: string, character: string[]) {
    const movie = this.movies.find((movie) => movie.id === +id);

    if (!movie) {
      throw new NotFoundException('존재하지 않는 id의 영화입니다.');
    }

    Object.assign(movie, { title, character });

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
