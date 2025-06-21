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
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { RoleEnum } from 'src/user/entity/user.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import { CurrentUser } from 'src/user/decorator/user.decorator';
import { QueryRunner } from 'typeorm';
import { AuthUser } from 'types/express';
import { CurrentQueryRunner } from 'src/common/decorator/query-runner.decorator';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('movie')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Public()
  // @UseInterceptors(CacheInterceptor)
  @Get()
  getMovies(@Query() dto: GetMoviesDto) {
    return this.movieService.findManyMovies(dto);
  }

  @Public()
  @Get(':id')
  getMovie(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.movieService.findMovieById(id);
  }

  @RBAC(RoleEnum.admin)
  @UseInterceptors(TransactionInterceptor)
  @Post()
  postMovie(
    @Body() dto: CreateMovieDto,
    @CurrentQueryRunner() qr: QueryRunner,
    @CurrentUser() user: AuthUser,
  ) {
    return this.movieService.createMovie(dto, user.sub, qr);
  }

  @RBAC(RoleEnum.admin)
  @Patch(':movieId')
  patchMovie(
    @Param('movieId', ParseIntPipe) movieId: number,
    @Body() dto: UpdateMovieDto,
  ) {
    return this.movieService.updateMovie(movieId, dto);
  }

  @RBAC(RoleEnum.admin)
  @Delete(':id')
  deleteMovie(@Param('id', ParseIntPipe) id: number) {
    return this.movieService.removeMovie(id);
  }
}
