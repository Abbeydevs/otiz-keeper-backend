import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { RegisterDto, LoginDto, ResetPasswordDto } from './dto/auth.dto';
import { JwtPayload } from './jwt.strategy';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findOneByEmail(
      registerDto.email,
    );

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    const token = uuidv4();
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);

    await this.prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token: token,
        expires: expires,
      },
    });

    // TODO: Send email with this token (We will do this later)
    console.log(
      `[MOCK EMAIL] Verify URL: http://localhost:3000/verify?token=${token}`,
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findOneByEmail(loginDto.email);

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: !!user.emailVerified,
      },
    };
  }

  async verifyEmail(token: string) {
    const verificationRecord = await this.prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationRecord) {
      throw new NotFoundException('Invalid verification token');
    }

    if (new Date() > verificationRecord.expires) {
      throw new BadRequestException('Verification token has expired');
    }

    await this.prisma.user.update({
      where: { email: verificationRecord.identifier },
      data: { emailVerified: new Date() },
    });

    await this.prisma.verificationToken.delete({
      where: { token },
    });

    return { message: 'Email successfully verified' };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      throw new NotFoundException('User with this email does not exist');
    }

    const token = uuidv4();
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);

    await this.prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token: token,
        expires: expires,
      },
    });

    const resetLink = `http://localhost:3000/reset-password?token=${token}`;
    console.log(`[MOCK EMAIL] Reset Password Link: ${resetLink}`);

    return { message: 'Password reset link sent to your email' };
  }

  async resetPassword(resetDto: ResetPasswordDto) {
    const resetRecord = await this.prisma.verificationToken.findUnique({
      where: { token: resetDto.token },
    });

    if (!resetRecord) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (new Date() > resetRecord.expires) {
      throw new BadRequestException('Reset token has expired');
    }

    const hashedPassword = await bcrypt.hash(resetDto.password, 10);

    await this.prisma.user.update({
      where: { email: resetRecord.identifier },
      data: { password: hashedPassword },
    });

    await this.prisma.verificationToken.delete({
      where: { token: resetDto.token },
    });

    return { message: 'Password has been successfully reset' };
  }
}
