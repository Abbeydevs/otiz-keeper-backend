import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '@prisma/client';
import type { RequestWithUser } from 'src/auth/interfaces/request-with-user.interface';

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  async createJob(
    @Req() req: RequestWithUser,
    @Body() createJobDto: CreateJobDto,
  ) {
    const user = req.user;

    if (user.role !== UserRole.EMPLOYER) {
      throw new ForbiddenException('Only employers can post jobs');
    }

    return this.jobsService.createJob(user.userId, createJobDto);
  }
}
