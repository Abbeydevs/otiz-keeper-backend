import { IsString, IsBoolean, IsDateString, IsOptional } from 'class-validator';

export class CreateExperienceDto {
  @IsString()
  jobTitle: string;

  @IsString()
  company: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsBoolean()
  isCurrent: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}
