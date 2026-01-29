import {
  Controller,
  Get,
  UseGuards,
  Req,
  Logger,
  Body,
  Patch,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProfilesService } from './profiles.service';
import { Request } from 'express';
import { UpdateTalentProfileDto } from './dto/update-talent.dto';

interface JwtUser {
  userId: string;
  email: string;
  role: string;
}

interface RequestWithUser extends Request {
  user: JwtUser;
}

@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfilesController {
  private readonly logger = new Logger(ProfilesController.name);

  constructor(private profilesService: ProfilesService) {}

  @Get('me')
  async getMyProfile(@Req() req: RequestWithUser) {
    const userId = req.user?.userId;

    this.logger.log(`Fetching profile for User ID: ${userId}`);

    return this.profilesService.getMyProfile(userId);
  }

  @Patch('talent')
  async updateTalentProfile(
    @Req() req: RequestWithUser,
    @Body() updateData: UpdateTalentProfileDto,
  ) {
    const userId = req.user?.userId;
    this.logger.log(`Updating Talent Profile for User ID: ${userId}`);

    return this.profilesService.updateTalentProfile(userId, updateData);
  }
}
