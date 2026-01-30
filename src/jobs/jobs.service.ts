import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { GetJobsFilterDto } from './dto/get-jobs.dto';
import { JobStatus, Prisma } from '@prisma/client';

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
}
