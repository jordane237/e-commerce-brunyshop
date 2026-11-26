import { ApiProperty } from '@nestjs/swagger';

export class ContactResponseDto {
  @ApiProperty({ description: 'Identifiant de la demande de contact' })
  id!: string;

  @ApiProperty({ format: 'date-time' })
  receivedAt!: string;

  @ApiProperty({ example: 'Votre message est envoyé. Nous répondons sous 24 h ouvrées.' })
  message!: string;
}
