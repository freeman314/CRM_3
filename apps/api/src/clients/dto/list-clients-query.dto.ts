import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ListClientsQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  pageSize?: number = 20;

  @ApiPropertyOptional({ description: 'Поисковая строка' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Фильтр по статусу' })
  @IsOptional()
  @IsString()
  statusId?: string;

  @ApiPropertyOptional({ description: 'Дедлайн (дней до конца контракта)' })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : undefined))
  @IsInt()
  dueInDays?: number;

  @ApiPropertyOptional({ description: 'Дата окончания контракта от (ISO)' })
  @IsOptional()
  @IsDateString()
  contractEndFrom?: string;

  @ApiPropertyOptional({ description: 'Дата окончания контракта до (ISO)' })
  @IsOptional()
  @IsDateString()
  contractEndTo?: string;
}


