import { Test, TestingModule } from '@nestjs/testing';
import { DirectorController } from './director.controller';
import { DirectorService } from './director.service';
import { createAutoMock } from 'test/auto-mock';
import { DirectorEntity } from './entity/director.entity';
import { CreateDirectorDto } from './dto/create-director.dto';
import { UpdateDirectorDto } from './dto/update-director.dto';

describe('DirectorController', () => {
  let directorController: DirectorController;
  let directorService: jest.Mocked<DirectorService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DirectorController],
      providers: [
        { provide: DirectorService, useValue: createAutoMock(DirectorService) },
      ],
    }).compile();

    directorController = module.get<DirectorController>(DirectorController);
    directorService = module.get<jest.Mocked<DirectorService>>(DirectorService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(directorController).toBeDefined();
    expect(directorService).toBeDefined();
  });

  describe('getManyDirectors', () => {
    it('should return DirectorEntity[], after call findManyDirectors method in DirectorService', async () => {
      const mockfindMnayDirectors = [
        { id: 1, name: 'coco' },
        { id: 2, name: 'chuchu' },
      ];
      const findmanySpy = jest
        .spyOn(directorService, 'findManyDirectors')
        .mockResolvedValue(mockfindMnayDirectors as DirectorEntity[]);

      const result = await directorController.getManyDirectors();

      expect(findmanySpy).toHaveBeenCalled();
      expect(result).toEqual(mockfindMnayDirectors);
    });
  });

  describe('getDirectoryById', () => {
    it('should return DirectorEntity, after call findDirectorById in DirectorService method', async () => {
      const directorId = 1;
      const mockFindOne = { id: 1, name: 'coco' };
      const findDirectorByIdSpy = jest
        .spyOn(directorService, 'findDirectorById')
        .mockResolvedValue(mockFindOne as DirectorEntity);

      const result = await directorController.getDirectoryById(directorId);

      expect(findDirectorByIdSpy).toHaveBeenCalledWith(directorId);
      expect(result).toEqual(mockFindOne);
    });
  });

  describe('postDirector', () => {
    it('should return DirectorEntity has been created, after call CreateDirector method in DirectorService', async () => {
      const createDirectorDto = { name: 'coco' };
      const createDirectorSpy = jest
        .spyOn(directorService, 'createDirector')
        .mockResolvedValue(
          createDirectorDto as CreateDirectorDto & DirectorEntity,
        );

      const result = await directorController.postDirector(
        createDirectorDto as CreateDirectorDto,
      );

      expect(result).toEqual(
        createDirectorDto as CreateDirectorDto & DirectorEntity,
      );
      expect(createDirectorSpy).toHaveBeenCalledWith(createDirectorDto);
    });
  });

  describe('patchDirector', () => {
    it('should return director id has been patched, after call DirectorService method', async () => {
      const directorId = 1;
      const updateDirectorDto = { name: 'chuchu' };
      const updateSpy = jest
        .spyOn(directorService, 'updateDirector')
        .mockResolvedValue(directorId);

      const result = await directorController.patchDirector(
        directorId,
        updateDirectorDto as UpdateDirectorDto,
      );

      expect(result).toBe(directorId);
      expect(updateSpy).toHaveBeenCalledWith(directorId, updateDirectorDto);
    });
  });

  describe('deleteDirector', () => {
    it('should return directorId has been deleted, after call service method', async () => {
      const directorId = 1;
      const deleteSpy = jest
        .spyOn(directorService, 'removeDirector')
        .mockResolvedValue(directorId);

      const result = await directorController.deleteDirector(directorId);

      expect(result).toBe(directorId);
      expect(deleteSpy).toHaveBeenCalledWith(directorId);
    });
  });
});
