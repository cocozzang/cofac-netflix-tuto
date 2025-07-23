import { MovieService } from './movie.service';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { MovieEntity } from './entity/movie.entity';
import { MovieDetailEntity } from './entity/movie-detail.entity';
import { DirectorEntity } from 'src/director/entity/director.entity';
import { GenreEntity } from 'src/genre/entity/genre.entity';
import { UserEntity } from 'src/user/entity/user.entity';
import { MovieUserLikeEntity } from './entity/movie-user-like.entity';
import { CommonService } from 'src/common/common.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import {
  createAutoMock,
  createMockCache,
  createMockDataSource,
  createMockRepository,
} from 'test/auto-mock';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { GetMoviesDto } from './dto/get-movies.dto';
import { ConfigModule } from '@nestjs/config';

describe('MovieService', () => {
  let movieService: MovieService;
  let movieServiceAny: any;
  let movieRepository: jest.Mocked<Repository<MovieEntity>>;
  let movieDetailRepository: jest.Mocked<Repository<MovieDetailEntity>>;
  let directorRepository: jest.Mocked<Repository<DirectorEntity>>;
  let genreRepository: jest.Mocked<Repository<GenreEntity>>;
  let userRepository: jest.Mocked<Repository<UserEntity>>;
  let movieUserLikeRepository: jest.Mocked<Repository<MovieUserLikeEntity>>;
  let datasource: jest.Mocked<DataSource>;
  let commonService: jest.Mocked<CommonService>;
  let cacheManager: Cache;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [
        MovieService,
        {
          provide: getRepositoryToken(MovieEntity),
          useValue: createMockRepository<MovieEntity>(),
        },
        {
          provide: getRepositoryToken(MovieDetailEntity),
          useValue: createMockRepository<MovieDetailEntity>(),
        },
        {
          provide: getRepositoryToken(DirectorEntity),
          useValue: createMockRepository<DirectorEntity>(),
        },
        {
          provide: getRepositoryToken(GenreEntity),
          useValue: createMockRepository<GenreEntity>(),
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: createMockRepository<UserEntity>(),
        },
        {
          provide: getRepositoryToken(MovieUserLikeEntity),
          useValue: createMockRepository<MovieUserLikeEntity>(),
        },
        {
          provide: DataSource,
          useValue: createMockDataSource(),
        },
        {
          provide: CommonService,
          useValue: createAutoMock(CommonService),
        },
        {
          provide: CACHE_MANAGER,
          useValue: createMockCache(),
        },
      ],
    }).compile();

    movieService = module.get<MovieService>(MovieService);
    movieServiceAny = movieService;
    movieRepository = module.get<jest.Mocked<Repository<MovieEntity>>>(
      getRepositoryToken(MovieEntity),
    );
    movieDetailRepository = module.get<
      jest.Mocked<Repository<MovieDetailEntity>>
    >(getRepositoryToken(MovieDetailEntity));
    directorRepository = module.get<jest.Mocked<Repository<DirectorEntity>>>(
      getRepositoryToken(DirectorEntity),
    );
    genreRepository = module.get<jest.Mocked<Repository<GenreEntity>>>(
      getRepositoryToken(GenreEntity),
    );
    userRepository = module.get<jest.Mocked<Repository<UserEntity>>>(
      getRepositoryToken(UserEntity),
    );
    movieUserLikeRepository = module.get<
      jest.Mocked<Repository<MovieUserLikeEntity>>
    >(getRepositoryToken(MovieUserLikeEntity));
    datasource = module.get<jest.Mocked<DataSource>>(DataSource);
    commonService = module.get<jest.Mocked<CommonService>>(CommonService);
    cacheManager = module.get<jest.Mocked<Cache>>(CACHE_MANAGER);
  });

  afterAll(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(movieService).toBeDefined();
    expect(movieRepository).toBeDefined();
    expect(movieDetailRepository).toBeDefined();
    expect(directorRepository).toBeDefined();
    expect(genreRepository).toBeDefined();
    expect(userRepository).toBeDefined();
    expect(movieUserLikeRepository).toBeDefined();
    expect(datasource).toBeDefined();
    expect(commonService).toBeDefined();
    expect(cacheManager).toBeDefined();
  });

  describe('findRecentMovies', () => {
    it('(brach: cache hit) should return recent movies from cache', async () => {
      const cachedMovies = [
        {
          id: 1,
          title: 'Movie 1',
        },
      ];
      jest.spyOn(cacheManager, 'get').mockResolvedValue(cachedMovies);

      const result = await movieService.findRecentMovies();

      expect(cacheManager.get).toHaveBeenCalledWith('MOVIE_RECENT');
      expect(result).toEqual(cachedMovies);
    });

    it('(branch: no cache hit) should return recent movies from db repo, then store the data to cache', async () => {
      const recentMovies = [{ id: 1, title: 'movie 1' }];

      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
      const findSpy = jest
        .spyOn(movieRepository, 'find')
        .mockResolvedValue(recentMovies as MovieEntity[]);

      const result = await movieService.findRecentMovies();

      expect(cacheManager.get).toHaveBeenCalled();
      expect(findSpy).toHaveBeenCalled();
      expect(result).toEqual(recentMovies);
    });
  });

  describe('findManyMovies', () => {
    let getMoviesMock: jest.SpyInstance;
    let getLikedmoviesMock: jest.SpyInstance;

    beforeEach(() => {
      getMoviesMock = jest.spyOn(movieServiceAny, 'getMovies');
      getLikedmoviesMock = jest.spyOn(movieServiceAny, 'getLikedMovies');
    });

    it('should return a list of movies without user likes', async () => {
      const movies = [{ id: 1, title: 'movie 1' }];
      const dto = { title: 'movie' } as GetMoviesDto;
      const qb = {
        where: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([movies, 1]),
      } as Partial<SelectQueryBuilder<MovieEntity>>;
      getMoviesMock.mockReturnValue(qb);
      jest
        .spyOn(commonService, 'applyCursorPaginationParamsToQb')
        .mockResolvedValue({ nextCursor: null } as never);

      const result = await movieService.findManyMovies(dto);

      expect(getMoviesMock).toHaveBeenCalled();
      expect(qb.where).toHaveBeenCalledWith('movie.title LIKE :title', {
        title: '%movie%',
      });
      // @ts-expect-error ref any type error
      expect(commonService.applyCursorPaginationParamsToQb(qb, dto));
      expect(result).toEqual({
        data: movies,
        nextCursor: null,
        count: 1,
      });
    });

    it('should return a list of movies with user likes', async () => {
      const movies = [
        { id: 1, title: 'movie1' },
        { id: 3, title: 'movie3' },
      ];

      const likedMovies = [
        { movie: { id: 1 }, isLike: true },
        { movie: { id: 2 }, isLike: true },
      ];

      const dto = { title: 'movie' } as GetMoviesDto;

      const qb = {
        where: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([movies, 1]),
      } as Partial<SelectQueryBuilder<MovieEntity>>;

      getMoviesMock.mockReturnValue(qb);
      const spy = jest
        .spyOn(commonService, 'applyCursorPaginationParamsToQb')
        .mockReturnValue({ nextCursor: null } as never);
      getLikedmoviesMock.mockResolvedValue(likedMovies);

      const userId = 1;
      const result = await movieService.findManyMovies(dto, userId);

      expect(getMoviesMock).toHaveBeenCalled();

      expect(qb.where).toHaveBeenCalledWith('movie.title LIKE :title', {
        title: '%movie%',
      });
      expect(spy).toHaveBeenCalledWith(qb, dto);
      expect(qb.getManyAndCount).toHaveBeenCalled();
      expect(getLikedmoviesMock).toHaveBeenCalledWith(
        movies.map((movie) => movie.id),
        userId,
      );
      expect(result).toMatchObject({
        data: [
          { id: 1, title: 'movie1', likeStatus: true },
          { id: 3, title: 'movie3', likeStatus: null },
        ],
        nextCursor: null,
        count: 1,
      });
    });
  });
});
