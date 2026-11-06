import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RefreshResponseDto {
  @ApiProperty({ description: 'Nouvel access JWT ' })
  accessToken: string = '';

  @ApiProperty({ description: 'Durée de validité en secondes ' })
  expiresIn: number = 0;

  @ApiPropertyOptional({ description: 'Nouveau refresh token en clair (mis en cookie) ' })
  refreshToken?: string = undefined;
}
