import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterDto {
  @ApiPropertyOptional({ example: 'client@example.cm' })
  @IsOptional()
  @IsEmail()
  @Type(() => String)
  @Matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: 'email invalide',
  })
  email?: string;

  @ApiPropertyOptional({
    example: '+237612345678',
    description: 'Téléphone au format +237XXXXXXXXX (9 chiffres après +237)',
  })
  @IsOptional()
  @Matches(/^\+237[0-9]{9}$/, {
    message: 'Le numéro de téléphone doit être au format +237XXXXXXXXX (9 chiffres après +237)',
  })
  phone?: string;

  @ApiProperty({ minLength: 10, description: 'Minimum 10 caractères' })
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  password!: string;

  @ApiProperty({ example: 'Jean', description: 'Prénom du client' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiProperty({ example: 'Dupont', description: 'Nom de famille du client' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiProperty({
    example: true,
    description: 'Vous devez accepter les CGV pour créer un compte',
  })
  @IsBoolean()
  termsAccepted!: boolean;

  @ApiProperty({
    example: '1.0',
    description: 'Version des CGV acceptée par le client (ex : "1.0")',
  })
  @IsString()
  @IsNotEmpty()
  termsVersion!: string;
}

// Validation croisée : au moins un des deux (email ou phone) doit être fourni.
export function hasAtLeastOne(dto: RegisterDto): boolean {
  return !!(dto.email || dto.phone);
}
