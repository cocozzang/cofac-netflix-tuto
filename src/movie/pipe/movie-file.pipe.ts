import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { rename } from 'node:fs/promises';
import { join } from 'node:path';
import { v4 } from 'uuid';

@Injectable()
export class MovieFilePipe
  implements PipeTransform<Express.Multer.File, Promise<Express.Multer.File>>
{
  constructor(
    private readonly options: {
      maxSizeMB: number;
      mimetype: string;
    },
  ) {}

  async transform(value: Express.Multer.File): Promise<Express.Multer.File> {
    if (!value) {
      throw new BadRequestException('movie 필드는 필수입니다.');
    }

    const byteSize = this.options.maxSizeMB * 1000000;

    if (value.size > byteSize) {
      throw new BadRequestException(
        `${this.options.maxSizeMB}MB 이하의 사이즈만 업로드 가능합니다.`,
      );
    }

    if (value.mimetype !== this.options.mimetype) {
      throw new BadRequestException(
        `${this.options.mimetype} 만 업로드 가능합니다.`,
      );
    }

    const split = value.originalname.split('.');

    let extension = 'mp4';

    if (split.length > 1) {
      extension = split[split.length - 1];
    }

    // uuid_Date.mp4
    const filename = `${v4()}_${Date.now()}.${extension}`;
    const newPath = join(value.destination, filename);

    await rename(value.path, newPath);

    return {
      ...value,
      filename,
      path: newPath,
    };
  }
}
