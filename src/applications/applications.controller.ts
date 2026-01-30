import {
  Controller,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  ForbiddenException,
  Get,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '@prisma/client';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post(':jobId')
  async apply(
    @Req() req: RequestWithUser,
    @Param('jobId') jobId: string,
    @Body() createApplicationDto: CreateApplicationDto,
  ) {
    const user = req.user;

    if (user.role !== UserRole.TALENT) {
      throw new ForbiddenException('Only talents can apply for jobs');
    }

    return this.applicationsService.applyForJob(
      user.userId,
      jobId,
      createApplicationDto,
    );
  }

  @Get('my-applications')
  async findMyApplications(@Req() req: RequestWithUser) {
    const user = req.user;

    if (user.role !== UserRole.TALENT) {
      throw new ForbiddenException('Only talents can view their applications');
    }

    return this.applicationsService.findMyApplications(user.userId);
  }

  @Get('job/:id')
  async findJobApplications(
    @Req() req: RequestWithUser,
    @Param('id') jobId: string,
  ) {
    const user = req.user;

    if (user.role !== UserRole.EMPLOYER) {
      throw new ForbiddenException('Only employers can view job applications');
    }

    return this.applicationsService.findJobApplications(user.userId, jobId);
  }
}
