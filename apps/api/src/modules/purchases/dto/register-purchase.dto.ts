import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

enum PurchaseProgramTypeDto {
  STANDARD = 'STANDARD',
  RESET = 'RESET',
  RESCUE = 'RESCUE',
  FULL_PRICE = 'FULL_PRICE',
}

export class RegisterPurchaseDto {
  @ApiProperty({ example: 'clx-patient-id' })
  @IsString()
  patientId!: string;

  @ApiProperty({ example: '2026-03-31T10:00:00.000Z' })
  @IsDateString()
  purchaseDate!: string;

  @ApiProperty({ example: '5 mg' })
  @IsString()
  dose!: string;

  @ApiProperty({ example: 3500 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  listPrice!: number;

  @ApiPropertyOptional({ example: 2450 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  finalPrice?: number;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ example: 1050 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discountApplied?: number;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isValid?: boolean;

  @ApiPropertyOptional({
    enum: PurchaseProgramTypeDto,
    default: PurchaseProgramTypeDto.STANDARD,
  })
  @IsOptional()
  @IsEnum(PurchaseProgramTypeDto)
  programTypeApplied?: PurchaseProgramTypeDto;
}
