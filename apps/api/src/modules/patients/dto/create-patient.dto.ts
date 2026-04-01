import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreatePatientDto {
  @ApiProperty({ example: 'Cristian Arevalo' })
  @IsString()
  @Length(3, 120)
  name!: string;

  @ApiProperty({ example: 'PAC-0001' })
  @IsString()
  @Length(3, 80)
  uniqueIdentifier!: string;
}
