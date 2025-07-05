import { Test, TestingModule } from '@nestjs/testing';
import { DirectorService } from './director.service';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';
import { DirectorEntity } from './entity/director.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateDirectorDto } from './dto/create-director.dto';
import { NotFoundException } from '@nestjs/common';
import { createMockRepository } from 'test/auto-mock';

describe('DirectorService', () => {
  let directorService: DirectorService;
  let directorRepository: jest.Mocked<Repository<DirectorEntity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DirectorService,
        {
          provide: getRepositoryToken(DirectorEntity),
          useValue: createMockRepository<DirectorEntity>(),
        },
      ],
    }).compile();

    directorService = module.get<DirectorService>(DirectorService);
    directorRepository = module.get<jest.Mocked<Repository<DirectorEntity>>>(
      getRepositoryToken(DirectorEntity),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(directorService).toBeDefined();
  });

  describe('createDirector', () => {
    it('should create a new director', async () => {
      const createDirectorDto = {
        name: 'coco',
      };

      const repoSaveSpy = jest
        .spyOn(directorRepository, 'save')
        .mockResolvedValue(createDirectorDto as DirectorEntity);

      const result = await directorService.createDirector(
        createDirectorDto as CreateDirectorDto,
      );

      expect(repoSaveSpy).toHaveBeenCalledWith(createDirectorDto);
      expect(result).toEqual(createDirectorDto);
    });
  });

  describe('findManyDirectors', () => {
    it('should return all director list', async () => {
      const directorList = [
        { id: 1, name: 'coco' },
        { id: 1, name: 'chuchu' },
      ];

      const findSpy = jest
        .spyOn(directorRepository, 'find')
        .mockResolvedValue(directorList as DirectorEntity[]);

      const result = await directorService.findManyDirectors();

      expect(findSpy).toHaveBeenCalled();
      expect(result).toEqual(directorList);
    });
  });

  describe('findDirectorById', () => {
    it('should return DirectorEntity by id', async () => {
      const directorId = 1;
      const expected = { id: directorId };

      const findOneSpy = jest
        .spyOn(directorRepository, 'findOne')
        .mockResolvedValue(expected as DirectorEntity);

      const result = await directorService.findDirectorById(directorId);

      expect(findOneSpy).toHaveBeenCalledWith({ where: { id: directorId } });
      expect(result).toEqual(expected);
    });
  });

  describe('updateDirector', () => {
    it('should return directorId has been updated', async () => {
      const directorId = 1;
      const updateDirectorDto = { name: 'chuchu' };

      const updateSpy = jest
        .spyOn(directorRepository, 'update')
        .mockResolvedValue({ affected: 1 } as UpdateResult);
      const findByIdSpy = jest
        .spyOn(directorRepository, 'findOne')
        .mockResolvedValue({ id: 1 } as DirectorEntity);

      const result = await directorService.updateDirector(
        directorId,
        updateDirectorDto,
      );

      expect(findByIdSpy).toHaveBeenCalledWith({ where: { id: directorId } });
      expect(updateSpy).toHaveBeenCalledWith(
        { id: directorId },
        { ...updateDirectorDto },
      );
      expect(result).toBe(directorId);
    });

    it('should throw NotFoundException, if no director by directorId', async () => {
      const directorId = 1;
      const updateDirectorDto = { name: 'chuchu' };

      const findByIdSpy = jest
        .spyOn(directorRepository, 'findOne')
        .mockResolvedValue(null);

      await expect(
        directorService.updateDirector(directorId, updateDirectorDto),
      ).rejects.toThrow(NotFoundException);
      expect(findByIdSpy).toHaveBeenCalledWith({ where: { id: directorId } });
    });
  });

  describe('removeDirector', () => {
    it('should return directorId, after delete a director by id', async () => {
      const directorId = 1;
      const deleteResult = { affected: 1 } as DeleteResult;
      const deleteSpy = jest
        .spyOn(directorRepository, 'delete')
        .mockResolvedValue(deleteResult);

      const result = await directorService.removeDirector(directorId);

      expect(result).toBe(directorId);
      expect(deleteSpy).toHaveBeenCalledWith({ id: directorId });
    });

    it('should throw NotFoundException, if no director by directorId', async () => {
      const directorId = 1;
      const deleteResult = { affected: 0 } as DeleteResult;
      const deleteSpy = jest
        .spyOn(directorRepository, 'delete')
        .mockResolvedValue(deleteResult);

      await expect(directorService.removeDirector(directorId)).rejects.toThrow(
        NotFoundException,
      );

      expect(deleteSpy).toHaveBeenCalledWith({ id: directorId });
    });
  });
});
