import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MovieEntity } from './entity/movie.entity';
import { Like, Repository } from 'typeorm';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(MovieEntity)
    private readonly movieRepository: Repository<MovieEntity>,
  ) {}

  findManyMovies(title?: string) {
    if (!title) return this.movieRepository.find();

    return this.movieRepository.findAndCount({
      where: {
        title: Like(`%${title}%`),
      },
    });
  }

  async findMovie(movieId: number) {
    const movie = await this.movieRepository.findOne({
      where: { id: movieId },
    });

    if (!movie)
      throw new NotFoundException(`${movieId}에 해당 하는 movie가 없습니다.`);

    return movie;
  }

  async createMovie(dto: CreateMovieDto) {
    const movie = await this.movieRepository.save(dto);

    return movie;
  }

  async updateMovie(movieId: number, dto: UpdateMovieDto) {
    const movie = await this.movieRepository.findOne({
      where: { id: movieId },
    });

    if (!movie)
      throw new NotFoundException(`${movieId}에 해당 하는 movie가 없습니다.`);

    await this.movieRepository.update({ id: movieId }, dto);

    const newMovie = await this.movieRepository.findOne({
      where: { id: movieId },
    });

    return newMovie;
  }

  async removeMovie(movieId: number) {
    const movie = await this.movieRepository.findOne({
      where: { id: movieId },
    });

    if (!movie)
      throw new NotFoundException(`${movieId}에 해당 하는 movie가 없습니다.`);

    await this.movieRepository.delete(movieId);

    return movieId;
  }
}
