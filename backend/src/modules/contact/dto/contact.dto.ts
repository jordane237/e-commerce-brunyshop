import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Equals,
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export const CONTACT_SUBJECTS = ['order', 'product', 'return', 'delivery', 'other'] as const;

export class ContactDto {
  @ApiProperty({ example: 'Awa Mbarga', maxLength: 150 })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name!: string;

  @ApiProperty({ example: 'awa@example.cm', maxLength: 254 })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiPropertyOptional({ example: '+237699000001' })
  @IsOptional()
  @Matches(/^\+237[0-9]{9}$/, {
    message: 'Le téléphone doit être au format +237XXXXXXXXX.',
  })
  phone?: string;

  @ApiProperty({ enum: CONTACT_SUBJECTS, description: 'Sujet de la demande' })
  @IsIn(CONTACT_SUBJECTS)
  subject!: (typeof CONTACT_SUBJECTS)[number];

  @ApiPropertyOptional({ example: 'BRN-2611-7K3F' })
  @IsOptional()
  @Matches(/^BRN-[0-9]{4}-[A-Z0-9]{4}$/, {
    message: 'La référence de commande doit ressembler à BRN-2611-7K3F.',
  })
  orderReference?: string;

  @ApiProperty({ minLength: 20, maxLength: 5000 })
  @IsString()
  @MinLength(20)
  @MaxLength(5000)
  message!: string;

  @ApiProperty({ example: true, description: 'Consentement pour répondre à la demande' })
  @IsBoolean()
  @Equals(true, { message: 'Le consentement est obligatoire pour envoyer le message.' })
  consent!: boolean;

  // Optional in the DTO so TurnstileGuard can return CAPTCHA_REQUIRED with a
  // clear message before class-validator gets involved.
  @ApiPropertyOptional({
    description: 'Jeton Cloudflare Turnstile obtenu par le widget invisible',
  })
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  turnstileToken?: string;
}
