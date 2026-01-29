import {
  Controller,
  Get,
  Req,
  UseGuards,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { Request } from 'express';

interface JwtUser {
  userId: string;
  email: string;
  role: string;
}

interface RequestWithUser extends Request {
  user: JwtUser;
}

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  private readonly logger = new Logger(SubscriptionsController.name);
  constructor(private prisma: PrismaService) {}

  @Get('my-billing')
  async getMyBilling(@Req() req: RequestWithUser) {
    this.logger.log(`Request User Object: ${JSON.stringify(req.user)}`);
    const userId = req.user?.userId;

    if (!userId) {
      this.logger.error(
        'Security Alert: Attempted to fetch billing with undefined User ID',
      );
      throw new UnauthorizedException('User context is invalid');
    }

    const payments = await this.prisma.payment.findMany({
      where: {
        subscription: { userId },
      },
      orderBy: { paidAt: 'desc' },
      take: 10,
    });

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
      orderBy: { endDate: 'desc' },
    });

    return {
      subscription,
      payments,
    };
  }
}
