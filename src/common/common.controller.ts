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

@ApiBearerAuth()
@Controller('common')
export class CommonController {
  constructor(private readonly commonService: CommonService) {}

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
  createVideo(
    @UploadedFile()
    video: Express.Multer.File,
  ) {
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
