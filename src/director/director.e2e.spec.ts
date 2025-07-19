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
import { RoleEnum, UserEntity } from 'src/user/entity/user.entity';
import { AuthService } from 'src/auth/auth.service';
import { GenreEntity } from 'src/genre/entity/genre.entity';
import { MovieDetailEntity } from 'src/movie/entity/movie-detail.entity';
import { MovieUserLikeEntity } from 'src/movie/entity/movie-user-like.entity';
import { MovieEntity } from 'src/movie/entity/movie.entity';
import { DirectorEntity } from './entity/director.entity';
import { CreateDirectorDto } from './dto/create-director.dto';

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
      const { body, statusCode } = await request(app.getHttpServer())
        .get('/director')
        .set('authorization', `bearer ${token}`);

      expect(statusCode).toBe(200);
    });
  });

  describe('[Post /movie]', () => {
    it('should get all movies', async () => {
      const createDirectorDto: CreateDirectorDto = {
        name: 'coco',
        dob: new Date('1977-06-16').toISOString(),
        nationality: 'South Korea',
      };

      const { body, statusCode } = await request(app.getHttpServer())
        .post('/director')
        .set('authorization', `bearer ${token}`)
        .send(createDirectorDto);

      expect(statusCode).toBe(201);
      console.log(new Date(Date.now()).toISOString());
    });
  });
});
