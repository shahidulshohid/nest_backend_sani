import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { PrismaService } from 'src/prisma.service';
import { UtilsService } from 'src/utils/utils.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginPayloadDto } from './dto/login-auth.dto';
import { ChengePasswordDto } from './dto/chenge-password-auth.dto';
import { ForgetPasswordDto } from './dto/forget-password-auth.dto';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class AuthService {

  constructor(
    private prisma: PrismaService,
    private readonly email: UtilsService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  // ── Register ──────────────────────────────────
// async create(createAuthDto: CreateAuthDto) {

//   const isUserExistByEmail = await this.prisma.user.findFirst({
//     where: { email: createAuthDto.email }
//   });

//   if (isUserExistByEmail && isUserExistByEmail.isVerified === false) {
//     const existingOtp = await this.cacheManager.get(`otp:${createAuthDto.email}`);
//     if (existingOtp) {
//       throw new ConflictException('Please check the inbox and verify your email');
//     }
//     await this.resendEmailVerificationOtp(createAuthDto.email);
//     throw new ConflictException('Please check the inbox and verify your email');
//   }

//   if (isUserExistByEmail) {
//     throw new ConflictException('User already exists');
//   }


//   const generateReferralCode = async (): Promise<string> => {
//     while (true) {
//       const code = `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
//       const exists = await this.prisma.user.findUnique({
//         where: { referralCode: code }
//       });
//       if (!exists) return code;
//     }
//   };

//   const referralCode = await generateReferralCode();


//   const otp = Math.floor(100000 + Math.random() * 900000).toString();
//   const hashedPassword = await bcrypt.hash(createAuthDto.password, 12);

//   await this.prisma.user.create({
//     data: {
//       fullName: createAuthDto.fullName,
//       email: createAuthDto.email,
//       password: hashedPassword,
//       profilePic: createAuthDto.profilePic,
//       isVerified: false,
//       referralCode,
//     }
//   });

//   await this.cacheManager.set(`otp:${createAuthDto.email}`, otp, 600000);

//   const emailContent = this.buildOtpEmail(createAuthDto.email, otp);
//   await this.email.SendAuthEmail(
//     createAuthDto.email,
//     "🔐 Email Verification Code - Action Required",
//     emailContent
//   );
// }

async create(createAuthDto: CreateAuthDto) {

  console.log(createAuthDto.referralCode)
  const isUserExistByEmail = await this.prisma.user.findFirst({
    where: { email: createAuthDto.email }
  });

  if (isUserExistByEmail && isUserExistByEmail.isVerified === false) {
    const existingOtp = await this.cacheManager.get(`otp:${createAuthDto.email}`);
    if (existingOtp) {
      throw new ConflictException('Please check the inbox and verify your email');
    }
    await this.resendEmailVerificationOtp(createAuthDto.email);
    throw new ConflictException('Please check the inbox and verify your email');
  }

  if (isUserExistByEmail) {
    throw new ConflictException('User already exists');
  }

  // ── Referral code check ──────────────────────
  let referrer;
  if (createAuthDto.referralCode) {
    referrer = await this.prisma.user.findUnique({
      where: { referralCode: createAuthDto.referralCode },
    });
    if (!referrer) {
      throw new BadRequestException('Invalid referral code');
    }
  }

  console.log(referrer)
  const generateReferralCode = async (): Promise<string> => {
    while (true) {
      const code = `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const exists = await this.prisma.user.findUnique({
        where: { referralCode: code }
      });
      if (!exists) return code;
    }
  };

  const referralCode = await generateReferralCode();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedPassword = await bcrypt.hash(createAuthDto.password, 12);

  const newUser = await this.prisma.user.create({
    data: {
      fullName: createAuthDto.fullName,
      email: createAuthDto.email,
      password: hashedPassword,
      profilePic: createAuthDto.profilePic,
      isVerified: false,
      referralCode,
    }
  });

  // ── Referral reward ──────────────────────────
  if (referrer) {
    await this.prisma.$transaction([
      this.prisma.referral.create({
        data: {
          referrerId: referrer.id,
          referredUserId: newUser.id,
        },
      }),
      this.prisma.user.update({
        where: { id: referrer.id },
        data: {
          walletBalance: { increment: 10 },
          referralCount: { increment: 1 },
        },
      }),
    ]);
  }

  await this.cacheManager.set(`otp:${createAuthDto.email}`, otp, 600000);

  const emailContent = this.buildOtpEmail(createAuthDto.email, otp);
  await this.email.SendAuthEmail(
    createAuthDto.email,
    "🔐 Email Verification Code - Action Required",
    emailContent
  );
}

  // ── Verify OTP ────────────────────────────────
  async verifyUser(otpCode: string, email: string) {

    if (!email || !otpCode) {
      throw new BadRequestException("Email and OTP are required!");
    }

    if (otpCode.length !== 6) {
      throw new BadRequestException("OTP must be 6 digits!");
    }

    const user = await this.prisma.user.findFirst({ where: { email } });

    if (!user) {
      throw new NotFoundException("User not found!");
    }

    if (user.isVerified) {
      throw new BadRequestException("User is already verified.");
    }

    const cachedOtp = await this.cacheManager.get<string>(`otp:${email}`);

    if (!cachedOtp) {
      throw new NotFoundException("OTP not found or expired. Please request a new OTP.");
    }

    if (cachedOtp !== otpCode.trim()) {
      throw new UnauthorizedException("Invalid OTP. Please check the code and try again.");
    }

    await this.prisma.user.update({
      where: { email },
      data: { isVerified: true },
    });

    await this.cacheManager.del(`otp:${email}`);

      const jwtPayload = {
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified
    };

    const accessToken = await this.jwtService.sign(jwtPayload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: "10d"
    });
    return {
      success: true,
      message: "Email verified successfully.",
      accessToken
    };
  }


  // ── Resend Verification OTP ───────────────────
  async resendEmailVerificationOtp(email: string) {

    if (!email) {
      throw new BadRequestException("Email is required");
    }

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.isVerified) {
      throw new BadRequestException("User is already verified.");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.cacheManager.set(`otp:${email}`, otp, 600000);

    const emailContent = this.buildOtpEmail(email, otp);
    await this.email.SendAuthEmail(
      email,
      "🔐 Email Verification Code - Action Required",
      emailContent
    );

    return { message: 'OTP resent successfully. Please check your email.' };
  }


  // ── Resend Reset Password OTP ─────────────────
  async resendResetPasswordOtp(email: string) {

    if (!email) {
      throw new BadRequestException("Email is required");
    }

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.cacheManager.set(`reset-otp:${email}`, otp, 600000);

    const emailContent = this.buildResetOtpEmail(user.fullName, user.email, otp);
    await this.email.SendAuthEmail(email, "🔐 Password Reset OTP", emailContent);

    return { message: 'OTP resent successfully. Please check your email.' };
  }


  // ── Login ─────────────────────────────────────
  async login(payload: LoginPayloadDto) {

    if (!payload.email || !payload.password) {
      throw new BadRequestException("Email and password is required!");
    }

    const isUser = await this.prisma.user.findFirst({ where: { email: payload.email } });

    if (!isUser) {
      throw new BadRequestException("Invalid email and password please try again!");
    }

    if (!isUser.isVerified) {
      const existingOtp = await this.cacheManager.get(`otp:${payload.email}`);
      if (existingOtp) {
        throw new UnauthorizedException('Please verify your email first. Check your inbox.');
      }
      await this.resendEmailVerificationOtp(payload.email);
      throw new UnauthorizedException('Your OTP has expired. A new OTP has been sent to your email.');
    }

    const compare = await bcrypt.compare(payload.password, isUser.password);

    if (!compare) {
      throw new BadRequestException("Invalid email and password please try again!");
    }

    const jwtPayload = {
      userId: isUser.id,
      fullName: isUser.fullName,
      email: isUser.email,
      role: isUser.role,
      isVerified: isUser.isVerified
    };

    const accessToken = await this.jwtService.sign(jwtPayload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: "10d"
    });

    const refeshToken = await this.jwtService.sign(jwtPayload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: "1y",
    });

    return { accessToken, refeshToken };
  }


  // ── Change Password ───────────────────────────
  async chengePassword(payload: ChengePasswordDto) {

    const user = await this.prisma.user.findFirst({ where: { email: payload.email } });

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    const isPasswordValid = await bcrypt.compare(payload.currentPassword, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect!');
    }

    if (payload.currentPassword === payload.newPassword) {
      throw new BadRequestException('New password must be different from current password!');
    }

    if (payload.newPassword !== payload.confirmPassword) {
      throw new BadRequestException('New password and confirm password do not match!');
    }

    const hashedPassword = await bcrypt.hash(payload.newPassword, 10);

    return await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    });
  }


  // ── Forget Password ───────────────────────────
  async forgetPassword(email: string) {

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException("User not found!");
    }

    if (!user.isVerified) {
      throw new UnauthorizedException("User account is not verified!");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await this.cacheManager.set(`reset-otp:${email}`, otp, 600000);

    const emailContent = this.buildResetOtpEmail(user.fullName, user.email, otp);
    await this.email.SendAuthEmail(user.email, "Password Reset OTP", emailContent);

    return {
      message: "We have sent a 6-digit OTP to your email address. Please check your inbox and use the OTP to reset your password.",
    };
  }

  // ── Verify Reset Password OTP ─────────────────
  async verifyResetPasswordOTP(payload: { email: string; otp: string }) {

    const user = await this.prisma.user.findUnique({ where: { email: payload.email } });

    if (!user) {
      throw new NotFoundException("User not found!");
    }

    const cachedOtp = await this.cacheManager.get<string>(`reset-otp:${payload.email}`);

    if (!cachedOtp) {
      throw new BadRequestException("OTP not found or expired. Please request a new OTP.");
    }

    if (cachedOtp !== payload.otp) {
      throw new BadRequestException("Invalid OTP!");
    }

    await this.cacheManager.del(`reset-otp:${payload.email}`);
    await this.cacheManager.set(`can-reset:${payload.email}`, true, 600000);

    return {
      message: "OTP verified successfully. You can now reset your password.",
    };
  }


  // ── Reset Password ────────────────────────────
  async resetPassword(payload: ForgetPasswordDto) {

    if (payload.newPassword !== payload.confirmPassword) {
      throw new BadRequestException("Passwords do not match!");
    }

    const user = await this.prisma.user.findUnique({ where: { email: payload.email } });

    if (!user) {
      throw new NotFoundException("User not found!");
    }

    const canReset = await this.cacheManager.get(`can-reset:${payload.email}`);

    if (!canReset) {
      throw new BadRequestException("User is not eligible for password reset!");
    }

    const hashedPassword = await bcrypt.hash(payload.newPassword, 12);

    await this.prisma.user.update({
      where: { email: payload.email },
      data: { password: hashedPassword },
    });

    await this.cacheManager.del(`can-reset:${payload.email}`);

    return { message: "Password reset successfully!" };
  }


  // ── Get Me ────────────────────────────────────
  async getMe(email: string) {

    const user = await this.prisma.user.findFirst({
      where: { email },
      select: {
        id: true,
        fullName: true,
        email: true,
        profilePic: true,
        role: true,
        isVerified: true,
        isSubscribed: true,
        planExpiration: true,
        referralCode: true,
        referralCount: true,
        walletBalance:true,
        Profile: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    return user;
  }


  // ── Refresh Token ─────────────────────────────
  async refeshToken(token: string) {

    token = token.trim();
    const refreshSecret = this.configService.get<string>("JWT_REFRESH_SECRET");

    try {
      const decoded = this.jwtService.verify(token, { secret: refreshSecret });

      const jwtPayload = {
        userId: decoded.id,
        fullName: decoded.fullName,
        email: decoded.email,
        role: decoded.role,
        isVerified: decoded.isVerified
      };

      const accessToken = this.jwtService.sign(jwtPayload, {
        secret: this.configService.get<string>("JWT_ACCESS_SECRET"),
        expiresIn: this.configService.get("JWT_ACCESS_EXPIRES_IN")
      });

      return { accessToken };
    } catch (err) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
  }


  // ── Email Templates ───────────────────────────
  private buildOtpEmail(email: string, otp: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 300;">Email Verification</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Secure your account with OTP verification</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hello there,</p>
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">We received a request to verify your email address. Please use the following verification code to proceed:</p>
              <div style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border: 2px solid #667eea; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Verification Code</p>
                <h1 style="color: #667eea; font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${otp}</h1>
              </div>
              <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <p style="color: #856404; font-size: 14px; margin: 0; line-height: 1.5;">
                  <strong>⚠️ Important:</strong> This verification code will expire in <strong>10 minutes</strong>.
                </p>
              </div>
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 20px 0;">If you didn't request this verification code, please ignore this email.</p>
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0;">
                <h3 style="color: #333333; font-size: 16px; margin: 0 0 10px 0;">🔒 Security Tips:</h3>
                <ul style="color: #666666; font-size: 14px; margin: 0; padding-left: 20px;">
                  <li style="margin: 5px 0;">Never share your verification code with anyone</li>
                  <li style="margin: 5px 0;">We will never ask for your code via phone or email</li>
                  <li style="margin: 5px 0;">Always verify the sender's email address</li>
                </ul>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #6c757d; font-size: 14px; margin: 0 0 10px 0;">Need help? Contact our support team</p>
              <p style="color: #6c757d; font-size: 14px; margin: 0;">Best regards,<br><strong style="color: #667eea;">Your App Team</strong></p>
              <div style="margin-top: 20px;">
                <p style="color: #adb5bd; font-size: 12px; margin: 0;">This email was sent to ${email}</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }


  private buildResetOtpEmail(fullName: string, email: string, otp: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 300;">Password Reset Request</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Reset your password securely with OTP</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hello <strong>${fullName}</strong>,</p>
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">We received a request to reset your password. Please use the following One-Time Password (OTP) to proceed:</p>
              <div style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border: 2px solid #667eea; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">One-Time Password</p>
                <h1 style="color: #667eea; font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${otp}</h1>
              </div>
              <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <p style="color: #856404; font-size: 14px; margin: 0; line-height: 1.5;">
                  <strong>⚠️ Important:</strong> This OTP will expire in <strong>10 minutes</strong>. Please complete your password reset before it expires.
                </p>
              </div>
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 20px 0;">If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0;">
                <h3 style="color: #333333; font-size: 16px; margin: 0 0 10px 0;">🔒 Security Tips:</h3>
                <ul style="color: #666666; font-size: 14px; margin: 0; padding-left: 20px;">
                  <li style="margin: 5px 0;">Never share your OTP with anyone</li>
                  <li style="margin: 5px 0;">We will never ask for your OTP via phone or email</li>
                  <li style="margin: 5px 0;">Always verify the sender's email address</li>
                  <li style="margin: 5px 0;">Use a strong and unique password</li>
                </ul>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #6c757d; font-size: 14px; margin: 0 0 10px 0;">Need help? Contact our support team</p>
              <p style="color: #6c757d; font-size: 14px; margin: 0;">Best regards,<br><strong style="color: #667eea;">Your App Team</strong></p>
              <div style="margin-top: 20px;">
                <p style="color: #adb5bd; font-size: 12px; margin: 0;">This email was sent to ${email}</p>
                <p style="color: #adb5bd; font-size: 12px; margin: 10px 0 0 0;">© ${new Date().getFullYear()} Your Company. All rights reserved.</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}