import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MovieEntity } from './entity/movie.entity';
import { DataSource, In, Repository } from 'typeorm';
import { MovieDetailEntity } from './entity/movie-detail.entity';
import { DirectorEntity } from 'src/director/entity/director.entity';
import { GenreEntity } from 'src/genre/entity/genre.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CommonService } from 'src/common/common.service';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(MovieEntity)
    private readonly movieRepository: Repository<MovieEntity>,
    @InjectRepository(MovieDetailEntity)
    private readonly movieDetailRepository: Repository<MovieDetailEntity>,
    @InjectRepository(DirectorEntity)
    private readonly directorRepository: Repository<DirectorEntity>,
    @InjectRepository(GenreEntity)
    private readonly genreRepository: Repository<GenreEntity>,
    private readonly datasource: DataSource,
    private readonly commonService: CommonService,
  ) {}

  async findManyMovies(dto: GetMoviesDto) {
    const { title } = dto;

    const qb = this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres');

    if (title) {
      qb.where('movie.title LIKE :title', { title: `%${title}%` });
    }

    // this.commonService.applyCursorPaginationParamsToQb(qb, dto);

    const { nextCursor } =
      await this.commonService.applyCursorPaginationParamsToQb(qb, dto);

    const [data, count] = await qb.getManyAndCount();

    return {
      data,
      nextCursor,
      count,
    };
  }

  async findMovieById(movieId: number) {
    const movie = await this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.genres', 'genres')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.detail', 'detail')
      .where('movie.id=:id', { id: movieId })
      .getOne();

    // const movie = await this.movieRepository.findOne({
    //   where: { id: movieId },
    //   relations: ['genres', 'detail', 'director'],
    // });
    //
    if (!movie)
      throw new NotFoundException(`${movieId}에 해당 하는 movie가 없습니다.`);

    return movie;
  }

  async createMovie(createMovieDto: CreateMovieDto) {
    const qr = this.datasource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const director = await qr.manager.findOne(DirectorEntity, {
        where: {
          id: createMovieDto.directorId,
        },
      });

      if (!director) {
        throw new NotFoundException('존재하지 않는 id의 director입니다.');
      }

      const genres = await qr.manager.find(GenreEntity, {
        where: { id: In(createMovieDto.genreIds) },
      });

      if (genres.length !== createMovieDto.genreIds.length) {
        throw new NotFoundException(
          `존재하지 않는 장르가 있습니다. 존재하는 ids ${genres.map((genre) => genre.id).join(',')}`,
        );
      }

      const movieDetail = await qr.manager
        .createQueryBuilder()
        .insert()
        .into(MovieDetailEntity)
        .values({
          detail: createMovieDto.detail,
        })
        .execute();

      const movieDetailId = movieDetail.identifiers[0].id as number;

      const movie = await qr.manager
        .createQueryBuilder()
        .insert()
        .into(MovieEntity)
        .values({
          title: createMovieDto.title,
          detail: {
            id: movieDetailId,
          },
          director,
        })
        .execute();

      const movieId = movie.identifiers[0].id as number;

      await qr.manager
        .createQueryBuilder()
        .relation(MovieEntity, 'genres')
        .of(movieId)
        .add(genres.map((genre) => genre.id));

      // const movie = await this.movieRepository.save({
      //   title: createMovieDto.title,
      //   detail: { detail: createMovieDto.detail },
      //   director,
      //   genres,
      // });
      //

      await qr.commitTransaction();

      return await this.movieRepository.findOne({
        where: {
          id: movieId,
        },
        relations: ['detail', 'genres', 'director'],
      });
    } catch (error) {
      await qr.rollbackTransaction();

      throw error;
    } finally {
      await qr.release();
    }
  }

  async updateMovie(movieId: number, updateMovieDto: UpdateMovieDto) {
    const qr = this.datasource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const movie = await qr.manager.findOne(MovieEntity, {
        where: { id: movieId },
        relations: ['detail', 'genres'],
      });

      if (!movie)
        throw new NotFoundException(`${movieId}에 해당 하는 movie가 없습니다.`);

      const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;

      let newDirector: DirectorEntity | null = null;

      if (directorId) {
        const director = await qr.manager.findOne(DirectorEntity, {
          where: {
            id: directorId,
          },
        });

        if (!director) {
          throw new NotFoundException('존재하지 않는 id의 director입니다.');
        }

        newDirector = director;
      }

      let newGenres: GenreEntity[] = [];

      if (genreIds && genreIds.length !== 0) {
        const genres = await qr.manager.find(GenreEntity, {
          where: { id: In(genreIds) },
        });

        if (genres.length !== genreIds.length) {
          throw new NotFoundException(
            `존재하지 않는 장르가 있습니다. 존재하는 ids ${genres.map((genre) => genre.id).join(',')}`,
          );
        }

        newGenres = genres;
      }

      const movieUpdateFields = {
        ...movieRest,
        ...(newDirector && { director: newDirector }),
      };

      await qr.manager
        .createQueryBuilder()
        .update(MovieEntity)
        .set(movieUpdateFields)
        .where('id=:id', { id: movieId })
        .execute();

      // await this.movieRepository.update({ id: movieId }, movieUpdateFields);

      if (detail) {
        await qr.manager
          .createQueryBuilder()
          .update(MovieDetailEntity)
          .set({ detail })
          .where('id=:id', { id: movie.detail.id })
          .execute();

        // await this.movieDetailRepository.update(
        //   { id: movie.detail.id },
        //   { detail },
        // );
      }

      if (newGenres) {
        await qr.manager
          .createQueryBuilder()
          .relation(MovieEntity, 'genres')
          .of(movieId)
          .addAndRemove(
            newGenres.map((genre) => genre.id),
            movie.genres.map((genre) => genre.id),
          );
      }

      //   const newMovie = (await this.movieRepository.findOne({
      //     where: { id: movieId },
      //     relations: ['detail', 'director'],
      //   })) as MovieEntity;
      //
      //   newMovie.genres = newGenres;
      //
      //   await this.movieRepository.save(newMovie);

      await qr.commitTransaction();

      return this.movieRepository.findOne({
        where: { id: movieId },
        relations: ['detail', 'director', 'genres'],
      });
    } catch (error) {
      await qr.rollbackTransaction();

      throw error;
    } finally {
      await qr.release();
    }
  }

  async removeMovie(movieId: number) {
    const movie = await this.movieRepository.findOne({
      where: { id: movieId },
      relations: ['detail'],
    });

    if (!movie)
      throw new NotFoundException(`${movieId}에 해당 하는 movie가 없습니다.`);

    await this.movieRepository
      .createQueryBuilder()
      .delete()
      .where('id=:id', { id: movieId })
      .execute();

    // await this.movieRepository.delete(movieId);

    await this.movieDetailRepository.delete(movie.detail.id);

    return movieId;
  }
}
