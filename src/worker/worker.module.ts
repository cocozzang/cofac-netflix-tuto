import { Module } from '@nestjs/common';
import { ThumbnailGenrationProcess } from './thumbnail-genration.worker';

@Module({
  providers: [ThumbnailGenrationProcess],
})
export class WorkerModule {}
