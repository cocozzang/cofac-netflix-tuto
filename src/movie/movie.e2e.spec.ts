/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from 'src/app.module';
import { DataSource } from 'typeorm';
import { DirectorEntity } from 'src/director/entity/director.entity';
import { GenreEntity } from 'src/genre/entity/genre.entity';
import { RoleEnum, UserEntity } from 'src/user/entity/user.entity';
import { MovieDetailEntity } from './entity/movie-detail.entity';
import { MovieEntity } from './entity/movie.entity';
import { MovieUserLikeEntity } from './entity/movie-user-like.entity';
import { AuthService } from 'src/auth/auth.service';
import { CreateMovieDto } from './dto/create-movie.dto';

describe('MovieController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  let users: UserEntity[];
  let directors: DirectorEntity[];
  let movies: MovieEntity[];
  let genres: GenreEntity[];

  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    await app.init();
  });

  beforeEach(async () => {
    dataSource = app.get<DataSource>(DataSource);
    await dataSource.synchronize();

    // Drop and recreate database schema to reset auto-increment values

    const movieRepository = dataSource.getRepository(MovieEntity);
    const movieDetailRepository = dataSource.getRepository(MovieDetailEntity);
    const userRepository = dataSource.getRepository(UserEntity);
    const directorRepository = dataSource.getRepository(DirectorEntity);
    const genreRepository = dataSource.getRepository(GenreEntity);
    const movieUserLikeRepository =
      dataSource.getRepository(MovieUserLikeEntity);

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
          createdAt: new Date(Date.now() - index * 1000 * 60 * 60),
          updatedAt: new Date(Date.now() - index * 1000 * 60 * 60),
        }) as MovieEntity,
    );

    await movieRepository.save(movies);

    movies = await movieRepository.find();

    const authService = app.get<AuthService>(AuthService);
    token = await authService.issueToken(
      { sub: users[0].id, role: RoleEnum.admin },
      false,
    );
  });

  afterEach(async () => {
    await dataSource.dropDatabase();
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  describe('[Get /movie]', () => {
    it('should get all movies', async () => {
      const { body, statusCode } = await request(app.getHttpServer()).get(
        '/movie',
      );

      expect(statusCode).toBe(200);
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('nextCursor');
      expect(body).toHaveProperty('count');

      expect(body.data).toHaveLength(5);
    });
  });

  describe('[GET /movie/recent]', () => {
    it('should get recent movies', async () => {
      const { body, statusCode } = await request(app.getHttpServer())
        .get('/movie/recent')
        .set('authorization', `bearer ${token}`);

      expect(statusCode).toBe(200);
      expect(body).toHaveLength(10);
    });
  });

  describe('[GET /movie/{id}]', () => {
    it('should get movie by id', async () => {
      const movieId = movies[0].id;

      const { body, statusCode } = await request(app.getHttpServer())
        .get(`/movie/${movieId}`)
        .set('authorization', `bearer ${token}`);

      expect(statusCode).toBe(200);
      expect(body.id).toBe(movieId);
    });

    it('should throw 404 notfound, if movie does not exist', async () => {
      const movieId = 6969;

      const { body, statusCode } = await request(app.getHttpServer())
        .get(`/movie/${movieId}`)
        .set('authorization', `Bearer ${token}`);

      expect(statusCode).toBe(404);
    });
  });

  describe('[POST /movie]', () => {
    it('should create movie', async () => {
      const {
        body: { fileName },
      } = await request(app.getHttpServer())
        .post(`/common/video`)
        .set('authorization', `bearer ${token}`)
        .attach('video', Buffer.from('test'), 'movie.mp4');

      const dto: CreateMovieDto = {
        title: 'test movie',
        detail: 'test movie detail',
        directorId: directors[0].id,
        genreIds: genres.map((genre) => genre.id),
        movieFileName: fileName,
      };

      const { body, statusCode } = await request(app.getHttpServer())
        .post(`/movie`)
        .set('authorization', `Bearer ${token}`)
        .send(dto);

      expect(statusCode).toBe(201);
      expect(body).toBeDefined();
      expect(body.title).toBe(dto.title);
      expect(body.detail.detail).toBe(dto.detail);
      expect(body.director.id).toBe(dto.directorId);
      expect(body.genres.map((genre) => genre.id)).toEqual(dto.genreIds);
      expect(body.movieFilePath).toContain(fileName);
    });
  });

  describe('DELETE - /movie/{id}', () => {
    it('200', async () => {
      const movieId = movies[0].id;

      const { body, statusCode } = await request(app.getHttpServer())
        .delete(`/movie/${movieId}`)
        .set('authorization', `Bearer ${token}`);

      expect(statusCode).toBe(200);
      expect(body.id).toBe(movieId);
    });

    it('404', async () => {
      const movieId = 6969;

      const { statusCode } = await request(app.getHttpServer())
        .delete(`/movie/${movieId}`)
        .set('authorization', `Bearer ${token}`);

      expect(statusCode).toBe(404);
    });
  });

  describe('POST - /movie/{id}/like', () => {
    it('should liek a movie', async () => {
      const movieId = movies[0].id;

      const { body, statusCode } = await request(app.getHttpServer())
        .post(`/movie/${movieId}/like`)
        .set('authorization', `Bearer ${token}`);

      expect(statusCode).toBe(201);
      expect(body.isLike).toBe(true);
    });

    it('should cancle like a movie', async () => {
      const movieId = movies[0].id;

      const firstRes = await request(app.getHttpServer())
        .post(`/movie/${movieId}/like`)
        .set('authorization', `Bearer ${token}`);

      expect(firstRes.statusCode).toBe(201);
      expect(firstRes.body.isLike).toBe(true);

      const secondRes = await request(app.getHttpServer())
        .post(`/movie/${movieId}/like`)
        .set('authorization', `Bearer ${token}`);

      expect(secondRes.statusCode).toBe(201);
      expect(secondRes.body.isLike).toBeNull();
    });
  });

  describe('POST - /movie/{id}/dislike', () => {
    it('should liek a movie', async () => {
      const movieId = movies[0].id;

      const { body, statusCode } = await request(app.getHttpServer())
        .post(`/movie/${movieId}/dislike`)
        .set('authorization', `Bearer ${token}`);

      expect(statusCode).toBe(201);
      expect(body.isLike).toBe(false);
    });

    it('should cancle like a movie', async () => {
      const movieId = movies[0].id;

      const firstRes = await request(app.getHttpServer())
        .post(`/movie/${movieId}/dislike`)
        .set('authorization', `Bearer ${token}`);

      expect(firstRes.statusCode).toBe(201);
      expect(firstRes.body.isLike).toBe(false);

      const secondRes = await request(app.getHttpServer())
        .post(`/movie/${movieId}/dislike`)
        .set('authorization', `Bearer ${token}`);

      expect(secondRes.statusCode).toBe(201);
      expect(secondRes.body.isLike).toBeNull();
    });
  });
});
