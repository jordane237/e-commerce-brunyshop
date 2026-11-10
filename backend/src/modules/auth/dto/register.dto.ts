import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
  MinLength,
} from 'class-validator';

import { AtLeastOneOf } from './at-least-one-of.constraint';

// Contrat AUT-01 (docs/backend/auth.md) : création de compte client avec un
// e-mail OU un téléphone camerounais, consentement CGV obligatoire.
export class RegisterDto {
  @ApiPropertyOptional({ example: 'client@exemple.cm' })
  @IsOptional()
  @IsEmail({}, { message: "L'e-mail n'est pas valide." })
  @MaxLength(255)
  @AtLeastOneOf(['email', 'phone'])
  email?: string;

  @ApiPropertyOptional({
    example: '+237612345678',
    description: 'Format strict +237 suivi de 9 chiffres',
  })
  @IsOptional()
  @Matches(/^\+237[0-9]{9}$/, {
    message: 'Le numéro de téléphone doit être au format +237XXXXXXXXX (9 chiffres après +237).',
  })
  phone?: string;

  @ApiProperty({ minLength: 10, maxLength: 128 })
  @IsString()
  @MinLength(10, { message: 'Le mot de passe doit contenir au moins 10 caractères.' })
  @MaxLength(128)
  password!: string;

  @ApiPropertyOptional({ example: 'Jean', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Dupont', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiProperty({ example: true, description: 'Consentement aux CGV (obligatoire)' })
  @IsBoolean({ message: 'Vous devez accepter les CGV pour créer un compte.' })
  termsAccepted!: boolean;

  @ApiProperty({ example: '1.0', description: 'Version des CGV acceptée' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  termsVersion!: string;
}
