import { BaseModelEntity } from 'src/common/entity/base-model.entity';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MovieDetailEntity } from './movie-detail.entity';
import { DirectorEntity } from 'src/director/entity/director.entity';
import { GenreEntity } from 'src/genre/entity/genre.entity';
import { Transform } from 'class-transformer';
import { UserEntity } from 'src/user/entity/user.entity';
import { MovieUserLikeEntity } from './movie-user-like.entity';

@Entity('movie')
export class MovieEntity extends BaseModelEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, (user) => user.createdMovies)
  creator: UserEntity;

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

  @Column({ default: 0 })
  dislikeCount: number;

  @OneToOne(() => MovieDetailEntity, (movieDetail) => movieDetail.id, {
    cascade: true,
    nullable: false,
  })
  @JoinColumn()
  detail: MovieDetailEntity;

  @Column()
  @Transform(({ value }) => `http://localhost:3000/${value}`)
  movieFilePath: string;

  @ManyToOne(() => DirectorEntity, (director) => director.id, {
    cascade: true,
    nullable: false,
  })
  director: DirectorEntity;

  @OneToMany(() => MovieUserLikeEntity, (mul) => mul.movie)
  likedUsers: MovieUserLikeEntity[];
}
