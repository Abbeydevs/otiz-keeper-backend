import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @ApiProperty({
    example: 'employer_basic',
    description: 'The ID of the plan to subscribe to',
  })
  @IsString()
  @IsNotEmpty()
  planId: string;
}
