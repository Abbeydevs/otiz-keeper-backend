import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  Min,
  IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { JobCategory, EmploymentType } from '@prisma/client';

export class GetJobsFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(JobCategory)
  category?: JobCategory;

  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isRemote?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}
