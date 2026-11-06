import { Injectable, CACHE_MANAGER } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../infrastructure/database/database.module';
import { BrandResponseDto } from '../dto/brand-response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RedisService } from '../../infrastructure/cache/cache.module';