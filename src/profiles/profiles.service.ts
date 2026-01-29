import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTalentProfileDto } from './dto/update-talent.dto';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { CreateEducationDto } from './dto/create-education.dto';

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService) {}

  async getMyProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        talentProfile: {
          include: {
            workExperiences: true,
            educations: true,
          },
        },
        employerProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;

    return result;
  }

  async updateTalentProfile(userId: string, data: UpdateTalentProfileDto) {
    return this.prisma.talentProfile.upsert({
      where: {
        userId: userId,
      },
      update: {
        ...data,
        updatedAt: new Date(),
      },
      create: {
        userId: userId,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        location: data.location || '',
        ...data,
      },
    });
  }

  async addWorkExperience(userId: string, data: CreateExperienceDto) {
    const talentProfile = await this.prisma.talentProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!talentProfile) {
      throw new NotFoundException(
        'Talent profile not found. Please update your profile details first.',
      );
    }

    return this.prisma.workExperience.create({
      data: {
        talentId: talentProfile.id,
        jobTitle: data.jobTitle,
        company: data.company,
        location: data.location,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        isCurrent: data.isCurrent,
        description: data.description,
      },
    });
  }

  async addEducation(userId: string, data: CreateEducationDto) {
    const talentProfile = await this.prisma.talentProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!talentProfile) {
      throw new NotFoundException('Talent profile not found');
    }

    return this.prisma.education.create({
      data: {
        talentId: talentProfile.id,
        institution: data.institution,
        degree: data.degree,
        fieldOfStudy: data.fieldOfStudy,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        isCurrent: data.isCurrent,
        grade: data.grade,
      },
    });
  }
}
