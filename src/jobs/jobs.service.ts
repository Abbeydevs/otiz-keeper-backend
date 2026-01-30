import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { GetJobsFilterDto } from './dto/get-jobs.dto';
import { JobStatus, Prisma } from '@prisma/client';
import { UpdateJobDto } from './dto/update-job.dto';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  async createJob(userId: string, data: CreateJobDto) {
    const employerProfile = await this.prisma.employerProfile.findUnique({
      where: { userId },
    });

    if (!employerProfile) {
      throw new NotFoundException(
        'Employer profile not found. Please complete your onboarding.',
      );
    }

    return this.prisma.job.create({
      data: {
        employerId: employerProfile.id,
        title: data.title,
        description: data.description,
        category: data.category,
        employmentType: data.employmentType,
        location: data.location,
        isRemote: data.isRemote || false,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        salaryCurrency: data.salaryCurrency || 'NGN',
        requirements: data.requirements || [],
        responsibilities: data.responsibilities || [],
        benefits: data.benefits || [],
        applicationDeadline: data.applicationDeadline
          ? new Date(data.applicationDeadline)
          : null,
        status: data.status || 'DRAFT',
        postToLinkedIn: data.postToLinkedIn || false,
      },
    });
  }

  async findAll(filters: GetJobsFilterDto) {
    const {
      page = 1,
      limit = 10,
      search,
      location,
      category,
      employmentType,
      isRemote,
    } = filters;

    const skip = (page - 1) * limit;

    const whereClause: Prisma.JobWhereInput = {
      status: JobStatus.ACTIVE,
    };

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        {
          employer: { companyName: { contains: search, mode: 'insensitive' } },
        },
      ];
    }

    if (location) {
      whereClause.location = { contains: location, mode: 'insensitive' };
    }

    if (category) {
      whereClause.category = category;
    }

    if (employmentType) {
      whereClause.employmentType = employmentType;
    }

    if (isRemote !== undefined) {
      whereClause.isRemote = isRemote;
    }

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where: whereClause,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          employer: {
            select: {
              companyName: true,
              logo: true,
              location: true,
            },
          },
        },
      }),
      this.prisma.job.count({ where: whereClause }),
    ]);

    return {
      data: jobs,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        employer: {
          select: {
            id: true,
            companyName: true,
            logo: true,
            location: true,
            website: true,
            industry: true,
            companySize: true,
            description: true,
          },
        },
        screeningQuestions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    return job;
  }

  async update(userId: string, jobId: string, data: UpdateJobDto) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { employer: true },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    if (job.employer.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to edit this job',
      );
    }

    return this.prisma.job.update({
      where: { id: jobId },
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        employmentType: data.employmentType,
        location: data.location,
        isRemote: data.isRemote,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        salaryCurrency: data.salaryCurrency,
        requirements: data.requirements,
        responsibilities: data.responsibilities,
        benefits: data.benefits,
        applicationDeadline: data.applicationDeadline
          ? new Date(data.applicationDeadline)
          : undefined,
        status: data.status,
        postToLinkedIn: data.postToLinkedIn,
      },
    });
  }

  async findMyJobs(userId: string) {
    const employerProfile = await this.prisma.employerProfile.findUnique({
      where: { userId },
    });

    if (!employerProfile) {
      throw new NotFoundException('Employer profile not found');
    }

    return this.prisma.job.findMany({
      where: { employerId: employerProfile.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    });
  }
}
