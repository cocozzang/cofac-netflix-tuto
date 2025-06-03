import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MovieEntity } from './entity/movie.entity';
import { Like, Repository } from 'typeorm';
import { MovieDetailEntity } from './entity/movie-detail.entity';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(MovieEntity)
    private readonly movieRepository: Repository<MovieEntity>,

    @InjectRepository(MovieDetailEntity)
    private readonly movieDetailRepository: Repository<MovieDetailEntity>,
  ) {}

  async findManyMovies(title?: string) {
    if (!title)
      return [
        await this.movieRepository.find(),
        await this.movieRepository.count(),
      ];

    return this.movieRepository.findAndCount({
      where: {
        title: Like(`%${title}%`),
      },
    });
  }

  async findMovieById(movieId: number) {
    const movie = await this.movieRepository.findOne({
      where: { id: movieId },
      relations: ['detail'],
    });

    if (!movie)
      throw new NotFoundException(`${movieId}에 해당 하는 movie가 없습니다.`);

    return movie;
  }

  async createMovie(createMovieDto: CreateMovieDto) {
    const movie = await this.movieRepository.save({
      title: createMovieDto.title,
      genre: createMovieDto.genre,
      detail: { detail: createMovieDto.detail },
    });

    return movie;
  }

  async updateMovie(movieId: number, updateMovieDto: UpdateMovieDto) {
    const movie = await this.movieRepository.findOne({
      where: { id: movieId },
      relations: ['detail'],
    });

    if (!movie)
      throw new NotFoundException(`${movieId}에 해당 하는 movie가 없습니다.`);

    const { detail, ...movieRest } = updateMovieDto;

    await this.movieRepository.update({ id: movieId }, movieRest);

    if (detail) {
      await this.movieDetailRepository.update(
        { id: movie.detail.id },
        { detail },
      );
    }

    const newMovie = await this.movieRepository.findOne({
      where: { id: movieId },
      relations: ['detail'],
    });

    return newMovie;
  }

  async removeMovie(movieId: number) {
    const movie = await this.movieRepository.findOne({
      where: { id: movieId },
      relations: ['detail'],
    });

    if (!movie)
      throw new NotFoundException(`${movieId}에 해당 하는 movie가 없습니다.`);

    await this.movieRepository.delete(movieId);

    await this.movieDetailRepository.delete(movie.detail.id);

    return movieId;
  }
}
