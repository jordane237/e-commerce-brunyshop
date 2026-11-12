import { ApiProperty } from '@nestjs/swagger';

export class PublicConfigDto {
  @ApiProperty({
    description: 'Indique si le CAPTCHA est actif côté serveur',
    example: true,
  })
  turnstileEnabled!: boolean;

  @ApiProperty({
    nullable: true,
    description: 'Clé publique Cloudflare Turnstile. Aucun secret n’est exposé.',
    example: '1x00000000000000000000BB',
  })
  turnstileSiteKey!: string | null;
}
