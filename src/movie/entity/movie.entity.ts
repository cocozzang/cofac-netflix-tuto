import { BaseModelEntity } from 'src/common/entity/base-model.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MovieDetailEntity } from './movie-detail.entity';

export enum MovieGenre {
  Fantasy = 'fantasy',
  Action = 'action',
}

@Entity('movie')
export class MovieEntity extends BaseModelEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  genre: MovieGenre;

  @OneToOne(() => MovieDetailEntity, (movieDetail) => movieDetail.id, {
    cascade: true,
  })
  @JoinColumn()
  detail: MovieDetailEntity;
}
