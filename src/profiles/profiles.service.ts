import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTalentProfileDto } from './dto/update-talent.dto';

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService) {}

  async getMyProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        talentProfile: true,
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
}
