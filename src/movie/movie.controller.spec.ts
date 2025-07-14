import { MovieController } from './movie.controller';
import { MovieService } from './movie.service';
import { TestBed } from '@suites/unit';
import { Mocked } from '@suites/doubles.jest';
import { GetMoviesDto } from './dto/get-movies.dto';
import { MovieEntity } from './entity/movie.entity';

describe('MovieController', () => {
  let controller: MovieController;
  let service: Mocked<MovieService>;

  beforeEach(async () => {
    const { unit, unitRef } = await TestBed.solitary(MovieController).compile();

    controller = unit;
    service = unitRef.get(MovieService) as unknown as Mocked<MovieService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('getMovies', () => {
    it('should return movie list', async () => {
      const getmoviesDto: GetMoviesDto = {
        title: 'movie',
        order: ['created_at__desc'],
        take: 1,
      };
      const mockFindManyMoviesResult = {
        data: [{ title: 'movie 1' }] as MovieEntity[],
        count: 1,
        nextCursor: null,
      };
      const spy = jest
        .spyOn(service, 'findManyMovies')
        .mockResolvedValue(mockFindManyMoviesResult);

      const result = await controller.getMovies(getmoviesDto);

      expect(result).toEqual(mockFindManyMoviesResult);
      expect(spy).toHaveBeenCalledWith(getmoviesDto, undefined);
    });
  });
});
