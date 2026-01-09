import { Controller, Get } from '@nestjs/common';
import { SUBSCRIPTION_PLANS } from './plans.constants';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Subscription & Payments')
@Controller('plans')
export class PaymentsController {
  @Get()
  @ApiOperation({ summary: 'Retrieve all subscription tiers' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of plans for talents and employers',
  })
  getPlans() {
    return {
      message: 'Plans retrieved successfully',
      data: SUBSCRIPTION_PLANS,
    };
  }
}
