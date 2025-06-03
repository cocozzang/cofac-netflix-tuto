import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
  Query,
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('movie')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  getMovies(@Query('title') title?: string) {
    return this.movieService.findManyMovies(title);
  }

  @Get(':id')
  getMovie(@Param('id') id: string) {
    return this.movieService.findMovie(+id);
  }

  @Post()
  postMovie(@Body() dto: CreateMovieDto) {
    return this.movieService.createMovie(dto);
  }

  @Patch(':movieId')
  patchMovie(
    @Param('movieId', ParseIntPipe) movieId: number,
    @Body() dto: UpdateMovieDto,
  ) {
    return this.movieService.updateMovie(movieId, dto);
  }

  @Delete(':id')
  deleteMovie(@Param('id') id: string) {
    return this.movieService.removeMovie(+id);
  }
}
