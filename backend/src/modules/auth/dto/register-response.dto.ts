import { ApiProperty } from '@nestjs/swagger';

// Réponse neutre AUT-01 : même structure et même message que le compte ait été
// créé ou que l'identifiant existe déjà (anti-énumération de comptes).
// Aucun jeton n'est émis ici : la connexion passe par POST /auth/login (AUT-02).
export class RegisterResponseDto {
  @ApiProperty({ example: '9f8j3k2l-9m5n-4p6q-7r8s-9t0u1v2w3x4y' })
  id!: string;

  @ApiProperty({ example: 'c***@exemple.cm', nullable: true })
  emailMasked!: string | null;

  @ApiProperty({ example: '***5678', nullable: true })
  phoneMasked!: string | null;

  @ApiProperty({ example: 'Jean', nullable: true })
  firstName!: string | null;

  @ApiProperty({ example: 'Dupont', nullable: true })
  lastName!: string | null;

  @ApiProperty({ example: 'PENDING_VERIFICATION' })
  status!: string;

  @ApiProperty({ example: '2026-11-05T10:30:00.000Z' })
  createdAt!: Date;

  @ApiProperty({
    example: 'Compte créé avec succès. Vous pouvez maintenant vous connecter.',
    description: 'Message neutre, identique en cas de doublon',
  })
  message!: string;
}
