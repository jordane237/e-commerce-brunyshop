import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BACKGROUND_QUEUE } from './queue.constants';

@Injectable()
export class QueueService {
  constructor(@InjectQueue(BACKGROUND_QUEUE) private readonly queue: Queue) {}

  async enqueue<T extends object>(name: string, payload: T): Promise<string> {
    const job = await this.queue.add(name, payload, {
      removeOnComplete: { count: 500 },
      removeOnFail: { count: 1000 },
    });
    return job.id ?? '';
  }
}
