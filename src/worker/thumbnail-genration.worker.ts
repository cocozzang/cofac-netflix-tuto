import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import * as ffmpegFluent from 'fluent-ffmpeg';
import { join } from 'path';
import { cwd } from 'process';

interface ThumbnailQueuData {
  videoPath: string;
  videoId: string;
}

interface ThumbnailJob extends Job {
  data: ThumbnailQueuData;
}

@Processor('thumbnail-genration')
export class ThumbnailGenrationProcess extends WorkerHost {
  // eslint-disable-next-line @typescript-eslint/require-await
  async process(job: ThumbnailJob) {
    const { videoId, videoPath } = job.data;

    console.log(`영상 트랜스코딩중... ID: ${videoId}`);

    const outputDirectory = join(cwd(), 'public', 'thumbnail');

    ffmpegFluent(videoPath)
      .screenshots({
        count: 1,
        filename: `${videoId}.png`,
        folder: outputDirectory,
        size: '320x180',
      })
      .on('end', () => {
        console.log(`썸네일 생성 완료! Id: ${videoId}`);
      })
      .on('error', (error) => {
        console.error(error);
        console.error(`썸네일 생성 실패! id: ${videoId}`);
      });
  }
}
