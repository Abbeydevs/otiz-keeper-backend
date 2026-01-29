import { IsString, IsBoolean, IsDateString, IsOptional } from 'class-validator';

export class CreateEducationDto {
  @IsString()
  institution: string;

  @IsString()
  degree: string;

  @IsString()
  fieldOfStudy: string;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsBoolean()
  isCurrent: boolean;

  @IsOptional()
  @IsString()
  grade?: string;
}
