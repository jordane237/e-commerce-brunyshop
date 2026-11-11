import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const CAMEROON_PHONE = /^\+237[0-9]{9}$/;

export class AddressSnapshotDto {
  @ApiProperty({ description: 'Nom du destinataire', maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  recipientName!: string;

  @ApiProperty({ description: 'Téléphone du destinataire (+237XXXXXXXXX)' })
  @IsString()
  @Matches(CAMEROON_PHONE, { message: 'Le téléphone doit être au format +237XXXXXXXXX.' })
  phone!: string;

  @ApiProperty({ description: 'Ville de livraison', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city!: string;

  @ApiProperty({ description: 'Quartier de livraison', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  district!: string;

  @ApiProperty({ description: 'Adresse ou rue', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  line!: string;

  @ApiPropertyOptional({ description: 'Point de repère', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  landmark?: string;

  @ApiPropertyOptional({ description: 'Instructions de livraison', maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  instructions?: string;
}
