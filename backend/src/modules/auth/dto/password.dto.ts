import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

// Always answers 202 whatever the account status (cachier §10.2: identical
// response whether the account exists or not).
export class ForgotPasswordDto {
  @ApiProperty({ example: 'client@exemple.cm' })
  @IsEmail()
  @MaxLength(254)
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'client@exemple.cm' })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ description: '6-digit code received by email' })
  @IsString()
  @Matches(/^[0-9]{6}$/, { message: 'code must be 6 digits' })
  code!: string;

  @ApiProperty({ minLength: 10, description: 'Minimum 10 chars, server-checked' })
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  newPassword!: string;
}
