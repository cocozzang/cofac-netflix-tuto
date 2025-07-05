import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DirectorEntity } from './entity/director.entity';
import { CreateDirectorDto } from './dto/create-director.dto';
import { UpdateDirectorDto } from './dto/update-director.dto';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class DirectorService {
  constructor(
    @InjectRepository(DirectorEntity)
    private readonly directorRepository: Repository<DirectorEntity>,
  ) {}

  findManyDirectors() {
    return this.directorRepository.find();
  }

  findDirectorById(directorId: number) {
    return this.directorRepository.findOne({ where: { id: directorId } });
  }

  createDirector(createDirectorDto: CreateDirectorDto) {
    return this.directorRepository.save(createDirectorDto);
  }

  async updateDirector(
    directorId: number,
    updateDirectorDto: UpdateDirectorDto,
  ) {
    const director = await this.directorRepository.findOne({
      where: { id: directorId },
    });

    if (!director)
      throw new NotFoundException(
        `Id가 ${directorId} 인 director는 존재하지 않습니다.`,
      );

    await this.directorRepository.update(
      {
        id: directorId,
      },
      { ...updateDirectorDto },
    );

    return directorId;
  }

  async removeDirector(directorId: number) {
    const { affected } = await this.directorRepository.delete({
      id: directorId,
    });

    if (affected === 0)
      throw new NotFoundException(
        `Id가 ${directorId} 인 director는 존재하지 않습니다.`,
      );

    return directorId;
  }
}
