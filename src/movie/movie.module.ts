import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovieEntity } from './entity/movie.entity';
import { MovieDetailEntity } from './entity/movie-detail.entity';
import { DirectorEntity } from 'src/director/entity/director.entity';
import { GenreEntity } from 'src/genre/entity/genre.entity';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MovieEntity,
      MovieDetailEntity,
      DirectorEntity,
      GenreEntity,
    ]),
    CommonModule,
  ],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
