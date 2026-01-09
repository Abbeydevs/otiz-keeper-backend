import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { SUBSCRIPTION_PLANS } from './plans.constants';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { User } from '@prisma/client';

@ApiTags('Subscription & Payments')
@Controller('subscriptions')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Retrieve all subscription tiers' })
  getPlans() {
    return {
      message: 'Plans retrieved successfully',
      data: SUBSCRIPTION_PLANS,
    };
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate a subscription payment' })
  async createSubscription(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
    @GetUser() user: User,
  ) {
    return this.paymentsService.initiateSubscription(
      user.email,
      createSubscriptionDto.planId,
    );
  }
}
