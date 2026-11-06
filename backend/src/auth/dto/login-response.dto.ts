import { ApiProperty } from '@nestjs/swagger';

import { UserResponseDto } from './me-response.dto';

export class LoginResponseDto {
  @ApiProperty({ description: 'JWT access token ' })
  accessToken: string = '';

  @ApiProperty({ description: 'Durée de validité en secondes (15 min par défaut) ' })
  expiresIn: number = 0;

  @ApiProperty({ description: 'Profil utilisateur connecté ' })
  user: UserResponseDto = {} as UserResponseDto;
}
