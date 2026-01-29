import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { Request } from 'express';

interface JwtUser {
  id: string;
  email: string;
  role: string;
}

interface RequestWithUser extends Request {
  user: JwtUser;
}

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private prisma: PrismaService) {}

  @Get('my-billing')
  async getMyBilling(@Req() req: RequestWithUser) {
    const userId = req.user.id;

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
      orderBy: { endDate: 'desc' },
    });

    const payments = await this.prisma.payment.findMany({
      where: {},
      orderBy: { paidAt: 'desc' },
      take: 10,
    });

    return {
      subscription,
      payments,
    };
  }
}
