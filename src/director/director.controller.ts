import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { DirectorService } from './director.service';
import { CreateDirectorDto } from './dto/create-director.dto';
import { UpdateDirectorDto } from './dto/update-director.dto';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
@Controller('director')
export class DirectorController {
  constructor(private readonly directorService: DirectorService) {}

  @Get()
  getManyDirectors() {
    return this.directorService.findManyDirectors();
  }

  @Get(':id')
  getDirectoryById(@Param('id', ParseIntPipe) directorId: number) {
    return this.directorService.findDirectorById(directorId);
  }

  @Post()
  postDirector(@Body() createDirectorDto: CreateDirectorDto) {
    return this.directorService.createDirector(createDirectorDto);
  }

  @Patch(':id')
  patchDirector(
    @Param('id', ParseIntPipe) directorId: number,
    @Body() updateDirectorDto: UpdateDirectorDto,
  ) {
    return this.directorService.updateDirector(directorId, updateDirectorDto);
  }

  @Delete(':id')
  deleteDirector(@Param('id', ParseIntPipe) directorId: number) {
    return this.directorService.removeDirector(directorId);
  }
}
