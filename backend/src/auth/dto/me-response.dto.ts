import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string = '';

  @ApiProperty({ example: 'client@exemple.cm' })
  email: string = '';

  @ApiPropertyOptional({ example: '+237600000000' })
  phone: string | null = null;

  @ApiProperty({ example: 'Jean' })
  firstName: string = '';

  @ApiProperty({ example: 'Dupont' })
  lastName: string = '';

  @ApiProperty({
    enum: ['ACTIVE', 'SUSPENDED', 'INACTIVE', 'PENDING_VERIFICATION', 'DELETED'],
    example: 'ACTIVE',
  })
  status: string = 'ACTIVE';

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00.000Z' })
  emailVerifiedAt: Date | null = null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date = new Date();

  @ApiProperty({
    type: [String],
    enum: ['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER', 'STOCK_MANAGER', 'LIVREUR', 'CUSTOMER'],
    example: ['CUSTOMER'],
  })
  roles: string[] = [];
}
