import { BaseModelEntity } from 'src/common/entity/base-model.entity';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MovieDetailEntity } from './movie-detail.entity';
import { DirectorEntity } from 'src/director/entity/director.entity';
import { GenreEntity } from 'src/genre/entity/genre.entity';

@Entity('movie')
export class MovieEntity extends BaseModelEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true,
  })
  title: string;

  @ManyToMany(() => GenreEntity, (genre) => genre.movies, {
    nullable: false,
  })
  @JoinTable()
  genres: GenreEntity[];

  @Column({ default: 0 })
  likeCount: number;

  @OneToOne(() => MovieDetailEntity, (movieDetail) => movieDetail.id, {
    cascade: true,
    nullable: false,
  })
  @JoinColumn()
  detail: MovieDetailEntity;

  @Column()
  movieFilePath: string;

  @ManyToOne(() => DirectorEntity, (director) => director.id, {
    cascade: true,
    nullable: false,
  })
  director: DirectorEntity;
}
