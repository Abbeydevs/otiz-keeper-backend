import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';

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
}
