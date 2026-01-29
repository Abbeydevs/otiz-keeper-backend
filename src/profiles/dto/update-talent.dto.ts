import { IsString, IsOptional, IsNumber, IsInt, Min } from 'class-validator';

export class UpdateTalentProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  headline?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  currentRole?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  yearsOfExperience?: number;

  @IsOptional()
  @IsNumber()
  expectedSalaryMin?: number;

  @IsOptional()
  @IsNumber()
  expectedSalaryMax?: number;

  @IsOptional()
  @IsString()
  profilePicture?: string;
}
