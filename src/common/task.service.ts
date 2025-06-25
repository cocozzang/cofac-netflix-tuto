import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { readdir, unlink } from 'fs/promises';
import { join, parse } from 'path';
import { MovieEntity } from 'src/movie/entity/movie.entity';
import { Repository } from 'typeorm';
import { DefaultLogger } from './logger/default.logger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class TaskService {
  // private readonly logger = new Logger(TaskService.name);

  constructor(
    @InjectRepository(MovieEntity)
    private readonly movieRepository: Repository<MovieEntity>,
    // private readonly logger: DefaultLogger,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  @Cron('*/5 * * * * *')
  logEverySecond() {
    this.logger.error('FATAL 레벨 로그', null, TaskService.name);
    this.logger.error('ERROR 레벨 로그', null, TaskService.name);
    this.logger.warn('WARN 레벨 로그', TaskService.name);
    this.logger.log('LOG 레벨 로그', TaskService.name);
    this.logger.debug!('DEBUG 레벨 로그', TaskService.name);
    this.logger.verbose!('VERBOSE 레벨 로그', TaskService.name);
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
