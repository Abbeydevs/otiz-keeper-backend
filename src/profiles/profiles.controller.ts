import {
  Controller,
  Get,
  UseGuards,
  Req,
  Logger,
  Body,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProfilesService } from './profiles.service';
import { Request } from 'express';
import { UpdateTalentProfileDto } from './dto/update-talent.dto';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { CreateEducationDto } from './dto/create-education.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import type { MulterFile } from 'src/cloudinary/cloudinary.service';
import { FileInterceptor } from '@nestjs/platform-express';

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

  constructor(
    private profilesService: ProfilesService,
    private cloudinaryService: CloudinaryService,
  ) {}

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

  @Post('experience')
  async addWorkExperience(
    @Req() req: RequestWithUser,
    @Body() data: CreateExperienceDto,
  ) {
    const userId = req.user?.userId;
    this.logger.log(`Adding Work Experience for User ID: ${userId}`);

    return this.profilesService.addWorkExperience(userId, data);
  }

  @Post('education')
  async addEducation(
    @Req() req: RequestWithUser,
    @Body() data: CreateEducationDto,
  ) {
    const userId = req.user?.userId;
    this.logger.log(`Adding Education for User ID: ${userId}`);

    return this.profilesService.addEducation(userId, data);
  }

  @Post('upload/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @Req() req: RequestWithUser,
    @UploadedFile() file: MulterFile,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const userId = req.user?.userId;
    this.logger.log(`Uploading Avatar for User ID: ${userId}`);

    const result = await this.cloudinaryService.uploadFile(file);
    const imageUrl: string = result.secure_url;
    const updateData: UpdateTalentProfileDto = {
      profilePicture: imageUrl,
    };

    return this.profilesService.updateTalentProfile(userId, updateData);
  }
}
