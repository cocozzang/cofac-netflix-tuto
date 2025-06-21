import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { MovieEntity } from './movie.entity';
import { UserEntity } from 'src/user/entity/user.entity';

@Entity('movie_user_like')
export class MovieUserLikeEntity {
  @PrimaryColumn({
    name: 'movieId',
    type: 'int8',
  })
  @ManyToOne(() => MovieEntity, (movie) => movie.likedUsers)
  movie: MovieEntity;

  @PrimaryColumn({
    name: 'userId',
    type: 'int8',
  })
  @ManyToOne(() => UserEntity, (user) => user.likedMovies)
  user: UserEntity;

  @Column()
  isLike: boolean;
}
