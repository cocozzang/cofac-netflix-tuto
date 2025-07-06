import { Test, TestingModule } from '@nestjs/testing';
import { GenreService } from './genre.service';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';
import { GenreEntity } from './entity/genre.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { createMockRepository } from 'test/auto-mock';
import { NotFoundException } from '@nestjs/common';
import { UpdateGenreDto } from './dto/update-genre.dto';

describe('GenreService', () => {
  let genreService: GenreService;
  let genreRepositroy: jest.Mocked<Repository<GenreEntity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenreService,
        {
          provide: getRepositoryToken(GenreEntity),
          useValue: createMockRepository<GenreEntity>(),
        },
      ],
    }).compile();

    genreService = module.get<GenreService>(GenreService);
    genreRepositroy = module.get<jest.Mocked<Repository<GenreEntity>>>(
      getRepositoryToken(GenreEntity),
    );
  });

  it('should be defined', () => {
    expect(genreService).toBeDefined();
    expect(genreRepositroy).toBeDefined();
  });

  describe('create', () => {
    it('should return GenreEntity has been created, after call repository method', async () => {
      const createGenreDto = { name: 'comic' } as GenreEntity;
      const findOneSpy = jest
        .spyOn(genreRepositroy, 'findOne')
        .mockResolvedValue(null);
      const saveSpy = jest
        .spyOn(genreRepositroy, 'save')
        .mockResolvedValue(createGenreDto);

      const result = await genreService.create(createGenreDto);

      expect(result).toEqual(createGenreDto);
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { name: createGenreDto.name },
      });
      expect(saveSpy).toHaveBeenCalledWith(createGenreDto);
    });

    it('should throw NotFoundException, if genre alread exist', async () => {
      const createGenreDto = { name: 'comic' } as GenreEntity;
      const findOneSpy = jest
        .spyOn(genreRepositroy, 'findOne')
        .mockResolvedValue(createGenreDto);

      await expect(genreService.create(createGenreDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { name: createGenreDto.name },
      });
    });
  });

  describe('findAll', () => {
    it('should return GenreEntity[], after call repository method', async () => {
      const mockFindResult = [
        { name: 'coco' },
        { name: 'chuchu' },
      ] as GenreEntity[];
      const findSpy = jest
        .spyOn(genreRepositroy, 'find')
        .mockResolvedValue(mockFindResult);

      const result = await genreService.findAll();

      expect(result).toEqual(mockFindResult);
      expect(findSpy).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return GenreEntity', async () => {
      const genreId = 1;
      const mockFindResult = { name: 'comic' } as GenreEntity;
      const findSpy = jest
        .spyOn(genreRepositroy, 'findOne')
        .mockResolvedValue(mockFindResult);

      const result = await genreService.findOne(genreId);

      expect(result).toEqual(mockFindResult);
      expect(findSpy).toHaveBeenCalledWith({ where: { id: genreId } });
    });
  });

  describe('update', () => {
    it('should return GenreEntity has been updated, after call repository method', async () => {
      const genreId = 1;
      const updateGenreDto = { name: 'new genre' } as UpdateGenreDto;
      const mockOldGenre = { name: 'old genre' } as GenreEntity;
      const updateResult = { affected: 1 } as UpdateResult;
      const findSpy = jest
        .spyOn(genreRepositroy, 'findOne')
        .mockResolvedValueOnce(mockOldGenre);
      jest
        .spyOn(genreRepositroy, 'findOne')
        .mockResolvedValue(updateGenreDto as GenreEntity);
      const updateSpy = jest
        .spyOn(genreRepositroy, 'update')
        .mockResolvedValue(updateResult);

      const result = await genreService.update(genreId, updateGenreDto);

      expect(findSpy).toHaveBeenNthCalledWith(1, { where: { id: genreId } });
      expect(findSpy).toHaveBeenNthCalledWith(2, { where: { id: genreId } });
      expect(updateSpy).toHaveBeenCalledWith({ id: genreId }, updateGenreDto);
      expect(result).toEqual(updateGenreDto);
    });

    it('should throw NotFoundException, if the genre dose not exist', async () => {
      const genreId = 1;
      const updateGenreDto = { name: 'new genre' } as UpdateGenreDto;
      const findSpy = jest
        .spyOn(genreRepositroy, 'findOne')
        .mockResolvedValue(null);

      await expect(
        genreService.update(genreId, updateGenreDto),
      ).rejects.toThrow(NotFoundException);

      expect(findSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('should return genreId, after call delete method in repository', async () => {
      const genreId = 1;
      const mockFindResult = { name: 'comic' } as GenreEntity;
      const findSpy = jest
        .spyOn(genreRepositroy, 'findOne')
        .mockResolvedValue(mockFindResult);
      const mockDeleteResult = { affected: 1 } as DeleteResult;
      const deleteSpy = jest
        .spyOn(genreRepositroy, 'delete')
        .mockResolvedValue(mockDeleteResult);

      const result = await genreService.remove(genreId);

      expect(result).toBe(genreId);
      expect(findSpy).toHaveBeenCalledWith({ where: { id: genreId } });
      expect(deleteSpy).toHaveBeenCalledWith(genreId);
    });

    it('should throw NotFoundException, if the genre dose not exist', async () => {
      const genreId = 1;
      const findSpy = jest
        .spyOn(genreRepositroy, 'findOne')
        .mockResolvedValue(null);

      await expect(genreService.remove(genreId)).rejects.toThrow(
        NotFoundException,
      );

      expect(findSpy).toHaveBeenCalledWith({ where: { id: genreId } });
    });
  });
});
