import { BaseModelEntity } from 'src/common/entity/base-model.entity';
import { MovieEntity } from 'src/movie/entity/movie.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('director')
export class DirectorEntity extends BaseModelEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  dob: Date;

  @Column()
  nationality: string;

  @OneToMany(() => MovieEntity, (movie) => movie.director)
  @JoinColumn()
  movies: MovieEntity[];
}
