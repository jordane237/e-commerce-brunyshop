import { BadRequestException, Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';

import { Public } from '../../../common/decorators/public.decorator';
import { SizeGuideResponseDto } from './dto/size-guide-response.dto';
import { SizeGuidesService } from './size-guides.service';

@ApiTags('catalog')
@Controller('size-guides')
export class SizeGuidesController {
  constructor(private readonly sizeGuides: SizeGuidesService) {}

  @Public()
  @Get(':categoryId')
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Guide des tailles d’une catégorie',
    description:
      'Retourne les tables de conversion EU/US/UK/cm (men, women, kids) du guide lié à la catégorie. Les guides hérités de la catégorie parente ne sont pas résolus en MVP.',
  })
  @ApiParam({
    name: 'categoryId',
    format: 'uuid',
    description: 'Identifiant UUID de la catégorie',
    example: '8b1f2c3d-0000-4000-8000-000000000001',
  })
  @ApiOkResponse({ description: 'Guide des tailles de la catégorie.', type: SizeGuideResponseDto })
  @ApiNotFoundResponse({
    description:
      'Catégorie inexistante (CATEGORY_NOT_FOUND) ou catégorie sans guide (SIZE_GUIDE_NOT_FOUND).',
  })
  @ApiTooManyRequestsResponse({
    description: 'Plus de 100 requêtes par minute (RATE_LIMIT_EXCEEDED).',
  })
  getByCategoryId(
    @Param(
      'categoryId',
      new ParseUUIDPipe({
        exceptionFactory: () =>
          new BadRequestException({
            code: 'VALIDATION_ERROR',
            message: 'L’identifiant de catégorie doit être un UUID valide.',
          }),
      }),
    )
    categoryId: string,
  ): Promise<SizeGuideResponseDto> {
    return this.sizeGuides.getByCategoryId(categoryId);
  }
}
