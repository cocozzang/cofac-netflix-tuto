import { Exclude } from 'class-transformer';

export enum MovieGenre {
  Fantasy = 'fantasy',
  Action = 'action',
}

export class Movie {
  id: number;
  title: string;

  @Exclude()
  genre: MovieGenre;
}
