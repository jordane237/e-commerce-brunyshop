import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

// Email or phone — one field for both account kinds.
export class LoginDto {
  @ApiProperty({ example: 'client@exemple.cm ou +2376XXXXXXXX' })
  @IsString()
  @MinLength(3)
  @MaxLength(254)
  identifier!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;

  // Optional so the guard can return CAPTCHA_REQUIRED before validation.
  @ApiPropertyOptional({ description: 'Jeton Cloudflare Turnstile' })
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  turnstileToken?: string;
}
