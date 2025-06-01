import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { MovieService } from './movie.service';

@Controller('movie')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  getMovies() {
    return this.movieService.findManyMovies();
  }

  @Get('search')
  searchMovie(@Query('title') title?: string) {
    if (!title) {
      throw new BadRequestException('title을 입력해주세요');
    }

    return this.movieService.findSearchedMovie(title);
  }

  @Get(':id')
  getMovie(@Param('id') id: string) {
    return this.movieService.findMovie(+id);
  }

  @Post()
  postMovie(
    @Body('title') title: string,
    @Body('character') character: string[],
  ) {
    return this.movieService.createMovie(title, character);
  }

  @Patch(':id')
  patchMovie(
    @Param('id') id: number,
    @Body('title') title: string,
    @Body('character') character: string[],
  ) {
    return this.movieService.updateMovie(id, title, character);
  }

  @Delete(':id')
  deleteMovie(@Param('id') id: string) {
    return this.movieService.removeMovie(+id);
  }
}
