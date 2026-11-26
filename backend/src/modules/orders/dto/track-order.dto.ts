import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class TrackOrderDto {
  @ApiProperty({
    example: 'BRN-2611-7K3F',
    description: 'Numéro de commande (format BRN-XXXX-XXXX).',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^BRN-[0-9]{4}-[A-Z0-9]{4}$/, {
    message: 'Le numéro de commande doit être au format BRN-XXXX-XXXX.',
  })
  reference!: string;

  @ApiProperty({
    example: '+237612345678',
    description: 'Téléphone associé à la commande (+237XXXXXXXXX).',
  })
  @IsString()
  @Matches(/^\+237[0-9]{9}$/, {
    message: 'Le téléphone doit être au format +237XXXXXXXXX.',
  })
  phone!: string;
}
