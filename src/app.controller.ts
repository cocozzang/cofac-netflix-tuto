import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AppService } from './app.service';

interface Movie {
  id: number;
  title: string;
  character: string[];
}

@Controller('movies')
export class AppController {
  private movies: Movie[] = [
    { id: 1, title: '해리포터', character: ['해리포터', '간달프'] },
    { id: 2, title: '스파이더맨', character: ['스파이더맨', '이쁜누님'] },
  ];

  private idCounter = 2;

  constructor(private readonly appService: AppService) {}

  @Get()
  getMovies() {
    return this.movies;
  }

  @Get('search')
  searchMovie(@Query('title') title?: string) {
    if (!title) {
      throw new BadRequestException('title을 입력해주세요');
    }

    const searchResult = this.movies.filter((movie) =>
      movie.title.startsWith(title),
    );

    return searchResult;
  }

  @Get(':id')
  getMovie(@Param('id') id: string) {
    const movie = this.movies.find((movie) => movie.id === +id);

    if (!movie) {
      throw new NotFoundException('존재하지 않는 id의 영화입니다.');
    }

    return movie;
  }

  @Post()
  postMovie(
    @Body('title') title: string,
    @Body('character') character: string[],
  ) {
    const movie: Movie = {
      id: ++this.idCounter,
      title,
      character,
    };

    this.movies.push(movie);

    return movie;
  }

  @Patch(':id')
  patchMovie(
    @Param('id') id: number,
    @Body('title') title: string,
    @Body('character') character: string[],
  ) {
    const movie = this.movies.find((movie) => movie.id === +id);

    if (!movie) {
      throw new NotFoundException('존재하지 않는 id의 영화입니다.');
    }

    Object.assign(movie, { title, character });

    return movie;
  }

  @Delete(':id')
  deleteMovie(@Param('id') id: number) {
    const movie = this.movies.find((movie) => movie.id === +id);

    if (!movie) {
      throw new NotFoundException('존재하지 않는 id의 영화입니다.');
    }

    this.movies = this.movies.filter((movie) => movie.id !== +id);

    return id;
  }
}
