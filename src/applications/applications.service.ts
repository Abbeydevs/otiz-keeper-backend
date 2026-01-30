import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
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
}
