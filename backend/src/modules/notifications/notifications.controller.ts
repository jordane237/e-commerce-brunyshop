// notifications.controller.ts
// Contrôleur admin NTF-01 : consultation de l'historique et de la dead-letter.
// Les endpoints sont protégés par JwtAuthGuard + RolesGuard (ADMIN ou SUPER_ADMIN).

import {
  Controller,
  Get,
  Param,
  Query,
  HttpStatus,
  ParseUUIDPipe,
  ParseIntPipe,
  Max,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  NotificationsService,
  type DeadLetterJob,
  type Notification,
} from './notifications.service';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('admin/notifications')
@Roles('SUPER_ADMIN', 'ADMIN')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('dead-letters')
  @ApiOperation({ summary: 'Liste paginée des tâches en dead-letter' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Liste paginée des jobs en échec' })
  async listDeadLetters(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), new Max(100), ParseIntPipe) limit: number,
    @Query('queueName') queueName?: string,
    @Query('jobName') jobName?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<{
    data: DeadLetterJob[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    return this.notifications.findDeadLetters({
      page,
      limit,
      queueName,
      jobName,
      from,
      to,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail dune notification' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Detail de la notification' })
  async getNotification(@Param('id', ParseUUIDPipe) id: string): Promise<Notification> {
    const notification = await this.notifications.findOne(id);
    if (notification === null) {
      throw new Error('Notification not found: ' + id);
    }
    return notification;
  }
}
