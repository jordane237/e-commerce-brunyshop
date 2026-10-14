import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

// Registration accepts email or phone (cachier ACC-01); at least one of them
// is enforced in the service.
export class RegisterDto {
  @ApiPropertyOptional({ example: 'client@exemple.cm' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+2376XXXXXXXX' })
  @IsOptional()
  @Matches(/^\+?[0-9]{8,15}$/, {
    message: 'phone must be digits with optional leading + (8-15 digits)',
  })
  phone?: string;

  @ApiProperty({ minLength: 3 })
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  firstName!: string;

  @ApiProperty({ minLength: 3 })
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  lastName!: string;

  @ApiProperty({ minLength: 10, description: 'Minimum 10 chars, server-checked' })
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  password!: string;
}
