import { Module } from '@nestjs/common';
import { DirectorService } from './director.service';
import { DirectorController } from './director.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DirectorEntity } from './entity/director.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DirectorEntity])],
  controllers: [DirectorController],
  providers: [DirectorService],
})
export class DirectorModule {}
