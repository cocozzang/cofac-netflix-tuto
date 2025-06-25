import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { readdir, unlink } from 'fs/promises';
import { join, parse } from 'path';
import { MovieEntity } from 'src/movie/entity/movie.entity';
import { Repository } from 'typeorm';
import { DefaultLogger } from './logger/default.logger';

@Injectable()
export class TaskService {
  // private readonly logger = new Logger(TaskService.name);

  constructor(
    @InjectRepository(MovieEntity)
    private readonly movieRepository: Repository<MovieEntity>,
    private readonly logger: DefaultLogger,
  ) {}

  @Cron('*/10 * * * * *')
  logEverySecond() {
    this.logger.fatal('FATAL 레벨 로그');
    this.logger.error('ERROR 레벨 로그');
    this.logger.warn('WARN 레벨 로그');
    this.logger.log('LOG 레벨 로그');
    this.logger.debug('DEBUG 레벨 로그');
    this.logger.verbose('VERBOSE 레벨 로그');
  }

  @Cron('0 0 0 * * *')
  async deleteOrphanMediaFiles() {
    const files = await readdir(join(process.cwd(), 'public', 'temp'));

    const deleteFilesTarget = files.filter((file) => {
      const filename = parse(file).name;

      const split = filename.split('_');

      if (split.length !== 2) {
        return true;
      }

      try {
        const fileDate = +new Date(parseInt(split[split.length - 1]));
        const aDayInMilSec = 24 * 60 * 60 * 1000;

        const now = +new Date();

        return now - fileDate > aDayInMilSec;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        return true;
      }
    });

    await Promise.all(
      deleteFilesTarget.map((filename) =>
        unlink(join(process.cwd(), 'public', 'temp', filename)),
      ),
    );
  }

  @Cron('0 * * * * *')
  async calculateMovieLikeCount() {
    await this.movieRepository.query(
      `UPDATE movie m SET "likeCount" = (SELECT count(*) FROM movie_user_like mul WHERE m.id = mul."movieId" AND mul."isLike" = true);`,
    );

    await this.movieRepository.query(
      `UPDATE movie m SET "dislikeCount" = (SELECT count(*) FROM movie_user_like mul WHERE m.id = mul."movieId" AND mul."isLike" = false);`,
    );
  }
}
