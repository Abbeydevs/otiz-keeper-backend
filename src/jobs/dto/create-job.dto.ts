import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  IsDateString,
  Min,
} from 'class-validator';
import { JobCategory, EmploymentType, JobStatus } from '@prisma/client';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(JobCategory)
  category: JobCategory;

  @IsEnum(EmploymentType)
  employmentType: EmploymentType;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsBoolean()
  @IsOptional()
  isRemote?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  salaryMin?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  salaryMax?: number;

  @IsString()
  @IsOptional()
  salaryCurrency?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requirements?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  responsibilities?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  benefits?: string[];

  @IsDateString()
  @IsOptional()
  applicationDeadline?: string;

  @IsBoolean()
  @IsOptional()
  postToLinkedIn?: boolean;

  @IsEnum(JobStatus)
  @IsOptional()
  status?: JobStatus;
}
