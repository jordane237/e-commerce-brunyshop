import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsOptional, IsDate, IsUUID, IsNotEmpty } from 'class-validator';

export class RegisterResponseDto {
  @ApiProperty({ example: '9f8j3k2l-9m5n-4p6q-7r8s-9t0u1v2w3x4y' })
  @IsUUID()
  id!: string;

  @ApiProperty({ example: 'c***@exemple.cm' })
  @IsString()
  @IsOptional()
  emailMasked!: string | null;

  @ApiProperty({ example: '+237612345678' })
  @IsString()
  @IsOptional()
  phoneMasked!: string | null;

  @ApiProperty({ example: 'Jean', description: 'Prénom du client' })
  @IsString()
  @IsOptional()
  firstName!: string | null;

  @ApiProperty({ example: 'Dupont', description: 'Nom de famille du client' })
  @IsString()
  @IsOptional()
  lastName!: string | null;

  @ApiProperty({ example: 'PENDING_VERIFICATION' })
  @IsString()
  @IsOptional()
  status!: string | null;

  @ApiProperty({ example: '2026-11-05T10:30:00.000Z' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  createdAt!: Date | null;

  @ApiProperty({
    example: 'Compte créé avec succès. Vous pouvez maintenant vous connecter.',
    description: 'Message neutre (même en cas de doublon silencieux)',
  })
  @IsString()
  @IsNotEmpty()
  message!: string;
}
