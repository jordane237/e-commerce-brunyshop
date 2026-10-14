import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

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
}
