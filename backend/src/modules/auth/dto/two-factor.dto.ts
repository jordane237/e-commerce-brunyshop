import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

// 6-digit TOTP code or 8-digit single-use backup code (cachier BOA-04).
export class TwoFactorVerifyDto {
  @ApiProperty({ description: 'TOTP 6 digits or backup code 8 digits' })
  @IsString()
  @Matches(/^[0-9]{6}$|^[0-9]{8}$/, {
    message: 'code must be 6 digits (TOTP) or 8 digits (backup)',
  })
  code!: string;
}
