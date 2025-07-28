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
  Req,
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { RoleEnum } from 'src/user/entity/user.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import { CurrentUser } from 'src/user/decorator/current-user.decorator';
import { QueryRunner } from 'typeorm';
import { AuthUser } from 'types/express';
import { CurrentQueryRunner } from 'src/common/decorator/current-query-runner.decorator';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { Throttle } from 'src/common/decorator/throttle.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';

@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
@Controller('movie')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @ApiOperation({
    description: '[Movie]를 pagination 해주는 api',
  })
  @ApiResponse({
    status: 200,
    description: '요청 성공',
  })
  @ApiResponse({
    status: 400,
    description: 'pagination query param을 잘못 입력했을때',
  })
  @Public()
  @Throttle({ count: 30, unit: 'minite' })
  @Get()
  getMovies(@Query() dto: GetMoviesDto, @CurrentUser() user?: AuthUser) {
    const userId = user && user.sub;

    return this.movieService.findManyMovies(dto, userId);
  }

  @Public()
  @UseInterceptors(CacheInterceptor)
  @CacheKey('getMoviesRecent')
  @CacheTTL(1000)
  @Get('recent')
  getMoviesRecent() {
    return this.movieService.findRecentMovies();
  }

  @Public()
  @Get(':id')
  getMovie(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const session = req.session;

    const movieCount = session.movieCount ?? {};

    req.session.movieCount = {
      ...movieCount,
      [id]: movieCount[id] ? movieCount[id] + 1 : 1,
    };

    console.log(session);

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

  @Post(':id/like')
  createMovieLike(
    @Param('id', ParseIntPipe) movieId: number,
    @CurrentUser() user: AuthUser,
  ) {
    const userId = user.sub;

    return this.movieService.toggleMovieLike(movieId, userId, true);
  }

  @Post(':id/dislike')
  createMovieDislike(
    @Param('id', ParseIntPipe) movieId: number,
    @CurrentUser() user: AuthUser,
  ) {
    const userId = user.sub;

    return this.movieService.toggleMovieLike(movieId, userId, false);
  }
}
