import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AppService } from './app.service';

@Controller('movies')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getMovies() {
    return this.appService.findManyMovies();
  }

  @Get('search')
  searchMovie(@Query('title') title?: string) {
    if (!title) {
      throw new BadRequestException('title을 입력해주세요');
    }

    return this.appService.findSearchedMovie(title);
  }

  @Get(':id')
  getMovie(@Param('id') id: string) {
    return this.appService.findMovie(+id);
  }

  @Post()
  postMovie(
    @Body('title') title: string,
    @Body('character') character: string[],
  ) {
    return this.appService.createMovie(title, character);
  }

  @Patch(':id')
  patchMovie(
    @Param('id') id: number,
    @Body('title') title: string,
    @Body('character') character: string[],
  ) {
    return this.appService.updateMovie(id, title, character);
  }

  @Delete(':id')
  deleteMovie(@Param('id') id: string) {
    return this.appService.removeMovie(+id);
  }
}
