import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
  Param,
  Patch,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { GetJobsFilterDto } from './dto/get-jobs.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '@prisma/client';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { UpdateJobDto } from './dto/update-job.dto';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  async findAll(@Query() filters: GetJobsFilterDto) {
    return this.jobsService.findAll(filters);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
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

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateJobDto: UpdateJobDto,
  ) {
    const user = req.user;

    if (user.role !== UserRole.EMPLOYER) {
      throw new ForbiddenException('Only employers can manage jobs');
    }

    return this.jobsService.update(user.userId, id, updateJobDto);
  }

  @Get('my-jobs')
  @UseGuards(JwtAuthGuard)
  async findMyJobs(@Req() req: RequestWithUser) {
    const user = req.user;
    if (user.role !== UserRole.EMPLOYER) {
      throw new ForbiddenException(
        'Only employers can view their job dashboard',
      );
    }
    return this.jobsService.findMyJobs(user.userId);
  }
}
