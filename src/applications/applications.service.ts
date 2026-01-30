import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ApplicationStatus } from '@prisma/client';

@Injectable()
export class ApplicationsService {
  constructor(private prisma: PrismaService) {}

  async applyForJob(userId: string, jobId: string, data: CreateApplicationDto) {
    const talentProfile = await this.prisma.talentProfile.findUnique({
      where: { userId },
    });

    if (!talentProfile) {
      throw new NotFoundException(
        'Talent profile not found. Please complete your onboarding.',
      );
    }

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.status !== 'ACTIVE') {
      throw new BadRequestException(
        'This job is no longer accepting applications',
      );
    }

    const existingApplication = await this.prisma.application.findFirst({
      where: {
        jobId,
        talentId: talentProfile.id,
      },
    });

    if (existingApplication) {
      throw new ConflictException('You have already applied for this job');
    }

    return this.prisma.application.create({
      data: {
        jobId,
        talentId: talentProfile.id,
        coverLetter: data.coverLetter,
        status: ApplicationStatus.ACTIVE,
      },
    });
  }

  async findMyApplications(userId: string) {
    const talentProfile = await this.prisma.talentProfile.findUnique({
      where: { userId },
    });

    if (!talentProfile) {
      throw new NotFoundException('Talent profile not found');
    }

    return this.prisma.application.findMany({
      where: { talentId: talentProfile.id },
      orderBy: { createdAt: 'desc' },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            location: true,
            employmentType: true,
            status: true,
            employer: {
              select: {
                companyName: true,
                logo: true,
              },
            },
          },
        },
      },
    });
  }

  async findJobApplications(userId: string, jobId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { employer: true },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.employer.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to view applications for this job',
      );
    }

    return this.prisma.application.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
      include: {
        talent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            headline: true,
            skills: {
              select: {
                skill: {
                  select: { name: true },
                },
              },
            },
            cvs: {
              where: { isPrimary: true },
              take: 1,
              select: {
                fileUrl: true,
                fileName: true,
              },
            },
            user: {
              select: {
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });
  }
}
