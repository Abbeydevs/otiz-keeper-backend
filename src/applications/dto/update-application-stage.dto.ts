import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApplicationStage } from '@prisma/client';

export class UpdateApplicationStageDto {
  @IsEnum(ApplicationStage, {
    message:
      'Invalid stage. Allowed values: APPLIED, SCREENING, SHORTLISTED, INTERVIEW, OFFER, HIRED, REJECTED',
  })
  stage: ApplicationStage;

  @IsOptional()
  @IsString()
  notes?: string;
}
