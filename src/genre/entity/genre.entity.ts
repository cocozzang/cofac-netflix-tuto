import { MovieEntity } from 'src/movie/entity/movie.entity';
import {
  BaseEntity,
  Column,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('genre')
export class GenreEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @ManyToMany(() => MovieEntity, (movie) => movie.genres)
  movies: MovieEntity[];
}
