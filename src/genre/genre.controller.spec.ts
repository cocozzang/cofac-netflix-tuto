import { Test, TestingModule } from '@nestjs/testing';
import { GenreController } from './genre.controller';
import { GenreService } from './genre.service';
import { createAutoMock } from 'test/auto-mock';
import { CreateGenreDto } from './dto/create-genre.dto';
import { GenreEntity } from './entity/genre.entity';
import { UpdateGenreDto } from './dto/update-genre.dto';

describe('GenreController', () => {
  let genreController: GenreController;
  let genreService: GenreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GenreController],
      providers: [
        { provide: GenreService, useValue: createAutoMock(GenreService) },
      ],
    }).compile();

    genreController = module.get<GenreController>(GenreController);
    genreService = module.get<jest.Mocked<GenreService>>(GenreService);
  });

  it('should be defined', () => {
    expect(genreController).toBeDefined();
    expect(genreService).toBeDefined();
  });

  describe('create', () => {
    it('should return GenreEntity has been created', async () => {
      const createDto: CreateGenreDto = { name: 'coco' };
      const serviceCreateSpy = jest
        .spyOn(genreService, 'create')
        .mockResolvedValue(createDto as GenreEntity);

      const result = await genreController.create(createDto);

      expect(result).toEqual(createDto);
      expect(serviceCreateSpy).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all genre', async () => {
      const mockData = [{ name: 'coco' }, { name: 'chuchu' }] as GenreEntity[];
      const serviceFindAllSpy = jest
        .spyOn(genreService, 'findAll')
        .mockResolvedValue(mockData);

      const result = await genreController.findAll();

      expect(result).toEqual(mockData);
      expect(serviceFindAllSpy).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return GenreEntity by id', async () => {
      const genreId = 1;
      const mockData = { name: 'coco' } as GenreEntity;
      const serviceFindSpy = jest
        .spyOn(genreService, 'findOne')
        .mockResolvedValue(mockData);

      const result = await genreController.findOne(genreId);

      expect(result).toEqual(mockData);
      expect(serviceFindSpy).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should return GenreEntity has been updated', async () => {
      const genreId = 1;
      const updateGenreDto: UpdateGenreDto = { name: 'chuchu' };
      const serviceUpdateSpy = jest
        .spyOn(genreService, 'update')
        .mockResolvedValue(updateGenreDto as GenreEntity);

      const result = await genreController.update(genreId, updateGenreDto);

      expect(result).toEqual(updateGenreDto);
      expect(serviceUpdateSpy).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should return genre id has been deleted', async () => {
      const genreId = 1;
      const serviceDeleteSpy = jest
        .spyOn(genreService, 'remove')
        .mockResolvedValue(genreId);

      const result = await genreController.delete(genreId);

      expect(result).toBe(genreId);
      expect(serviceDeleteSpy).toHaveBeenCalled();
    });
  });
});
