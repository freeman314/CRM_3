import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CallResult } from '@prisma/client';

export class CreateCallDto {
  @ApiProperty()
  @IsString()
  clientId: string;

  @ApiProperty()
  @IsString()
  managerId: string;

  @ApiProperty({ enum: CallResult })
  @IsEnum(CallResult)
  result: CallResult;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  newStatusId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  newPotential?: string;
}


