import { Cache, CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovieEntity } from './entity/movie.entity';
import { MovieDetailEntity } from './entity/movie-detail.entity';
import { DirectorEntity } from 'src/director/entity/director.entity';
import { GenreEntity } from 'src/genre/entity/genre.entity';
import { UserEntity } from 'src/user/entity/user.entity';
import { MovieUserLikeEntity } from './entity/movie-user-like.entity';
import { MovieService } from './movie.service';
import { CommonService } from 'src/common/common.service';
import { DataSource, Repository } from 'typeorm';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

describe('MovieService - Integration Test', () => {
  let service: MovieService;
  let serviceAny: any;
  let cacheManager: Cache;
  let dataSource: DataSource;

  let users: UserEntity[];
  let directors: DirectorEntity[];
  let movies: MovieEntity[];
  let genres: GenreEntity[];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CacheModule.register(),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          entities: [
            MovieEntity,
            MovieDetailEntity,
            DirectorEntity,
            GenreEntity,
            UserEntity,
            MovieUserLikeEntity,
          ],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([
          MovieEntity,
          MovieDetailEntity,
          DirectorEntity,
          GenreEntity,
          UserEntity,
          MovieUserLikeEntity,
        ]),
        ConfigModule.forRoot(),
      ],
      providers: [MovieService, CommonService],
    }).compile();

    service = module.get<MovieService>(MovieService);
    serviceAny = service;
    cacheManager = module.get<Cache>(CACHE_MANAGER);
    dataSource = module.get<DataSource>(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(cacheManager).toBeDefined();
    expect(dataSource).toBeDefined();
  });

  afterAll(async () => {
    await dataSource.dropDatabase();
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await cacheManager.clear();

    const movieRepository = dataSource.getRepository(MovieEntity);
    const movieDetailRepository = dataSource.getRepository(MovieDetailEntity);
    const userRepository = dataSource.getRepository(UserEntity);
    const directorRepository = dataSource.getRepository(DirectorEntity);
    const genreRepository = dataSource.getRepository(GenreEntity);

    users = [1, 2].map((userId) =>
      userRepository.create({
        id: userId,
        email: `${userId}@test.com`,
        password: 'test-password!@',
      }),
    );

    await userRepository.save(users);

    directors = [1, 2].map((directorId) =>
      directorRepository.create({
        id: directorId,
        dob: new Date('2000-01-01'),
        nationality: 'SouthKorea',
        name: `Director Name ${directorId}`,
      }),
    );

    await directorRepository.save(directors);

    genres = [1, 2].map((genreId) =>
      genreRepository.create({
        id: genreId,
        name: `genre ${genreId}`,
      }),
    );

    await genreRepository.save(genres);

    movies = Array.from<number, MovieEntity>(
      { length: 15 },
      (_value, index) =>
        ({
          id: index + 1,
          title: `movie ${index + 1}`,
          creator: users[0],
          genres: genres,
          likeCount: 0,
          dislikeCount: 9,
          detail: movieDetailRepository.create({
            detail: `movie detail ${index}`,
          }),
          movieFilePath: `movies/movie${index}.mp4`,
          director: directors[0],
          createdAt: new Date(Date.now()),
        }) as MovieEntity,
    );

    await movieRepository.save(movies);
  });

  describe('findRecentMovies', () => {
    it('should return recent movies', async () => {
      const result = (await service.findRecentMovies()) as MovieEntity[];

      const sortedResult = [...movies];
      sortedResult.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );

      const sortedResultIds = sortedResult
        .slice(0, 10)
        .map((movie) => movie.id);

      expect(result).toHaveLength(10);
      expect(result.map((movie) => movie.id)).toEqual(sortedResultIds);
    });

    it('should cache recent movies', async () => {
      const result = (await service.findRecentMovies()) as MovieEntity[];

      const cachedData = await cacheManager.get('MOVIE_RECENT');

      expect(cachedData).toEqual(result);
    });
  });

  describe('findAll', () => {
    it('should return movies with correct titles', async () => {
      const dto: GetMoviesDto = {
        title: 'movie 15',
        order: ['createdAt_DESC'],
        take: 10,
      };

      const result = await service.findManyMovies(dto);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe(dto.title);
      expect(result.data[0]).not.toHaveProperty('likeStatus');
    });

    it('should return likeStatus if userid is provided', async () => {
      const dto = { order: ['createdAt_DESC'], take: 10 } as GetMoviesDto;

      const result = await service.findManyMovies(dto, users[0].id);

      expect(result.data).toHaveLength(10);
      expect(result.data[0]).toHaveProperty('likeStatus');
    });
  });

  describe('createMovie', () => {
    beforeEach(() => {
      jest.spyOn(serviceAny, 'renameMovieFile').mockResolvedValue(undefined);
    });

    it('should create movie correctly', async () => {
      const createMovieDto: CreateMovieDto = {
        title: 'test movie',
        detail: 'movie detail',
        directorId: directors[0].id,
        genreIds: genres.map((genre) => genre.id),
        movieFileName: 'test.mp4',
      };

      const result = await service.createMovie(
        createMovieDto,
        users[0].id,
        dataSource.createQueryRunner(),
      );

      expect(result?.title).toBe(createMovieDto.title);
      expect(result?.director.id).toBe(createMovieDto.directorId);
      expect(result?.genres.map((genre) => genre.id)).toEqual(
        createMovieDto.genreIds,
      );
      expect(result?.detail.detail).toBe(createMovieDto.detail);
    });
  });

  describe('update', () => {
    it('should update movie', async () => {
      const movieId = movies[0].id;

      const updateMovieDto: UpdateMovieDto = {
        title: 'updated title',
        detail: 'updated movie detial',
        directorId: directors[1].id,
        genreIds: [genres[0].id],
      };

      const result = await service.updateMovie(movieId, updateMovieDto);

      expect(result?.title).toBe(updateMovieDto.title);
      expect(result?.detail.detail).toBe(updateMovieDto.detail);
      expect(result?.director.id).toBe(updateMovieDto.directorId);
      expect(result?.genres.map((genre) => genre.id)).toEqual(
        updateMovieDto.genreIds,
      );
    });

    it('should throw error if movie does not exist', async () => {
      const notExistedMovieId = 6969;
      const updateMovieDto: UpdateMovieDto = {
        title: 'updated movie1',
      };

      await expect(
        service.updateMovie(notExistedMovieId, updateMovieDto),
      ).rejects.toThrow(NotFoundException);
    });

    describe('remove', () => {
      let movieRepository: Repository<MovieEntity>;

      beforeEach(() => {
        movieRepository = dataSource.getRepository(MovieEntity);
      });

      it('should remove movie', async () => {
        const removeId = movies[0].id;
        const result = await service.removeMovie(removeId);
        const DBResult = await movieRepository.findOne({
          where: { id: removeId },
        });

        expect(result).toEqual({ id: removeId });
        expect(DBResult).toBeNull();
      });

      it('should throw error if movie does not exist', async () => {
        const notExistedMovieId = 6969;

        await expect(service.removeMovie(notExistedMovieId)).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('toggleMovieLike', () => {
      it('should create like', async () => {
        const userId = users[0].id;
        const movieId = movies[0].id;

        const result = await service.toggleMovieLike(movieId, userId, true);

        expect(result).toEqual({ isLike: true });
      });

      it('should create dislike', async () => {
        const userId = users[0].id;
        const movieId = movies[0].id;

        const result = await service.toggleMovieLike(movieId, userId, false);

        expect(result).toEqual({ isLike: false });
      });

      it('should toggle like', async () => {
        const userId = users[0].id;
        const movieId = movies[0].id;

        await service.toggleMovieLike(movieId, userId, true);
        const result = await service.toggleMovieLike(movieId, userId, true);

        expect(result.isLike).toBeFalsy();
      });

      it('should toggle dislike', async () => {
        const userId = users[0].id;
        const movieId = movies[0].id;

        await service.toggleMovieLike(movieId, userId, false);
        const result = await service.toggleMovieLike(movieId, userId, false);

        expect(result.isLike).toBeFalsy();
      });
    });

    describe('findMovieById', () => {
      it('should return movie by id', async () => {
        const movieId = movies[0].id;

        const result = await service.findMovieById(movieId);

        expect(result.id).toBe(movieId);
      });

      it('should throw NotFoundException if movie does not exist', async () => {
        const notExistedMovieId = 6969;

        await expect(service.findMovieById(notExistedMovieId)).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });
});
