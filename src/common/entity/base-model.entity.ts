import { CreateDateColumn, UpdateDateColumn, VersionColumn } from 'typeorm';

export class BaseModelEntity {
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @VersionColumn()
  version: number;
}
