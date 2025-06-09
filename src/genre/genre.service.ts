import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { GenreEntity } from './entity/genre.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GenreService {
  constructor(
    @InjectRepository(GenreEntity)
    private readonly genreRepositroy: Repository<GenreEntity>,
  ) {}

  async create(createGenreDto: CreateGenreDto) {
    const genre = await this.genreRepositroy.findOne({
      where: { name: createGenreDto.name },
    });

    if (genre) throw new NotFoundException('이미 존재하는 genre입니다.');

    return this.genreRepositroy.save(createGenreDto);
  }

  findAll() {
    return this.genreRepositroy.find();
  }

  findOne(id: number) {
    return this.genreRepositroy.findOne({ where: { id } });
  }

  async update(id: number, updateGenreDto: UpdateGenreDto) {
    const genre = await this.genreRepositroy.findOne({ where: { id } });

    if (!genre) throw new NotFoundException('존재하지 않는 genre입니다.');

    await this.genreRepositroy.update({ id }, updateGenreDto);

    const newGenre = await this.genreRepositroy.findOne({ where: { id } });

    return newGenre;
  }

  async remove(id: number) {
    const genre = await this.genreRepositroy.findOne({ where: { id } });

    if (!genre) throw new NotFoundException('존재하지 않는 genre입니다.');

    await this.genreRepositroy.delete(id);

    return id;
  }
}
