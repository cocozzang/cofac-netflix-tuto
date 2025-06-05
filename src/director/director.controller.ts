import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { DirectorService } from './director.service';
import { CreateDirectorDto } from './dto/create-director.dto';
import { UpdateDirectorDto } from './dto/update-director.dto';

@Controller('director')
export class DirectorController {
  constructor(private readonly directorService: DirectorService) {}

  @Get()
  getManyDirectors() {
    return this.directorService.findManyDirectors();
  }

  @Get(':id')
  getDirectoryById(@Param('id') directorId: string) {
    return this.directorService.findDirectorById(+directorId);
  }

  @Post()
  postDirector(@Body() createDirectorDto: CreateDirectorDto) {
    return this.directorService.createDirector(createDirectorDto);
  }

  @Patch(':id')
  patchDirector(
    @Param('id') directorId: string,
    @Body() updateDirectorDto: UpdateDirectorDto,
  ) {
    return this.directorService.updateDirector(+directorId, updateDirectorDto);
  }

  @Delete(':id')
  deleteDirector(@Param('id') directorId: string) {
    return this.directorService.removeDirector(+directorId);
  }
}
