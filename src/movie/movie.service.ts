import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MovieEntity } from './entity/movie.entity';
import { In, Like, Repository } from 'typeorm';
import { MovieDetailEntity } from './entity/movie-detail.entity';
import { DirectorEntity } from 'src/director/entity/director.entity';
import { GenreEntity } from 'src/genre/entity/genre.entity';

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
  ) {}

  async findManyMovies(title?: string) {
    const qb = this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres');

    if (title) {
      qb.where('movie.title LIKE :title', { title: `%${title}%` });
    }

    return await qb.getManyAndCount();

    //   if (!title)
    //     return [
    //       await this.movieRepository.find({ relations: ['genres', 'director'] }),
    //       await this.movieRepository.count(),
    //     ];
    //
    //   return this.movieRepository.findAndCount({
    //     where: {
    //       title: Like(`%${title}%`),
    //     },
    //     relations: ['genres', 'director'],
    //   });
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
    const director = await this.directorRepository.findOne({
      where: {
        id: createMovieDto.directorId,
      },
    });

    if (!director) {
      throw new NotFoundException('존재하지 않는 id의 director입니다.');
    }

    const genres = await this.genreRepository.find({
      where: { id: In(createMovieDto.genreIds) },
    });

    if (genres.length !== createMovieDto.genreIds.length) {
      throw new NotFoundException(
        `존재하지 않는 장르가 있습니다. 존재하는 ids ${genres.map((genre) => genre.id).join(',')}`,
      );
    }

    const movieDetail = await this.movieDetailRepository
      .createQueryBuilder()
      .insert()
      .into(MovieDetailEntity)
      .values({
        detail: createMovieDto.detail,
      })
      .execute();

    const movieDetailId = movieDetail.identifiers[0].id as number;

    const movie = await this.movieRepository
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

    await this.movieRepository
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

    return await this.movieRepository.findOne({
      where: {
        id: movieId,
      },
      relations: ['detail', 'genres', 'director'],
    });
  }

  async updateMovie(movieId: number, updateMovieDto: UpdateMovieDto) {
    const movie = await this.movieRepository.findOne({
      where: { id: movieId },
      relations: ['detail', 'genres'],
    });

    if (!movie)
      throw new NotFoundException(`${movieId}에 해당 하는 movie가 없습니다.`);

    const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;

    let newDirector: DirectorEntity | null = null;

    if (directorId) {
      const director = await this.directorRepository.findOne({
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
      const genres = await this.genreRepository.find({
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

    await this.movieRepository
      .createQueryBuilder()
      .update(MovieEntity)
      .set(movieUpdateFields)
      .where('id=:id', { id: movieId })
      .execute();

    // await this.movieRepository.update({ id: movieId }, movieUpdateFields);

    if (detail) {
      await this.movieDetailRepository
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
      await this.movieRepository
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

    return this.movieRepository.findOne({
      where: { id: movieId },
      relations: ['detail', 'director', 'genres'],
    });
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
