import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { readdir, unlink } from 'fs/promises';
import { join, parse } from 'path';

@Injectable()
export class TaskService {
  constructor() {}

  logEverySecond() {
    console.log('1초마다 로그 찍힘');
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
}
