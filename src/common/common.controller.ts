import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CommonService } from './common.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@ApiBearerAuth()
@Controller('common')
export class CommonController {
  constructor(
    private readonly commonService: CommonService,
    @InjectQueue('thumbnail-genration')
    private readonly thumbnailQueue: Queue,
  ) {}

  @UseInterceptors(
    FileInterceptor('video', {
      limits: {
        fileSize: 50000000,
      },
      fileFilter(_req, file, callback) {
        if (file.mimetype !== 'video/mp4') {
          return callback(
            new BadRequestException('mp4파일을 업로드 해주세요.'),
            false,
          );
        }

        return callback(null, true);
      },
    }),
  )
  @Post('video')
  async createVideo(
    @UploadedFile()
    video: Express.Multer.File,
  ) {
    await this.thumbnailQueue.add(
      'thumbnail',
      {
        videoId: video.filename,
        videoPath: video.path,
      },
      // {
      //   // bullmq 주요옵션설명, DV는 defualt value
      //   priority: 0, // queue추가시 우선순위, DV 0
      //   delay: 100, // queue 작업 처리시작 딜레이, DV 0
      //   attempts: 0, // 재시도 횟수 DV 0
      //   lifo: true, // queue가 아닌 stack처럼 되어버림, DV: false
      //   removeOnComplete: true, // 작업완료시 삭제, DV: false
      //   removeOnFail: true, // 작업 실패시 삭제, DV: false
      // },
    );

    return {
      fileName: video.filename,
    };
  }

  @Post('presigned-url')
  async createPresignedUrl() {
    return {
      url: await this.commonService.createPresignedUrl(),
    };
  }
}
