import { Controller, Get, Post, Body, HttpCode, HttpStatus, UnauthorizedException, Req, UseGuards, Put } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginPayloadDto } from './dto/login-auth.dto';
import { ChengePasswordDto } from './dto/chenge-password-auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ForgetPasswordDto } from './dto/forget-password-auth.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: 'Register a new user and send OTP to email' })
  @ApiBody({ schema: { example: { fullName: 'John Doe', email: 'john@example.com', password: '123456', profilePic: '' } } })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createAuthDto: CreateAuthDto) {
    const result = await this.authService.create(createAuthDto);
    return {
      success: true,
      message: "We have sent a 6-digit verification code to your email address.",
    };
  }

  @Post("verify-otp")
  @ApiOperation({ summary: 'Verify email with OTP code' })
  @ApiBody({ schema: { example: { email: 'john@example.com', otp: '123456' } } })
  @HttpCode(HttpStatus.OK)
  async verifyUser(@Body() payload: { otp: string; email: string }) {
    if (!payload.otp) {
      throw new UnauthorizedException('OTP is missing or invalid');
    }
    const result = await this.authService.verifyUser(payload.otp, payload.email);
    return {
      success: true,
      message: "Email verification completed successfully! Your account is now verified.",
      data:{acccessToken:result.accessToken}
    };
  }

  @Post("resend-otp")
  @ApiOperation({ summary: 'Resend email verification OTP' })
  @ApiBody({ schema: { example: { email: 'john@example.com' } } })
  @HttpCode(HttpStatus.OK)
  async resendEmailVerificationOtp(@Body() payload: { email: string }) {
    const result = await this.authService.resendEmailVerificationOtp(payload.email);
    return {
      success: true,
      message: "Verification OTP resent to your email",
    };
  }

  @Post("login")
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ schema: { example: { email: 'john@example.com', password: '123456' } } })
  @HttpCode(HttpStatus.OK)
  async login(@Body() payload: LoginPayloadDto) {
    const result = await this.authService.login(payload);
    return {
      success: true,
      message: "User login successfully!",
      data: {
        accessToken: result.accessToken,
        refeshToken: result.refeshToken,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password' })
  @ApiBody({ schema: { example: { currentPassword: '123456', newPassword: '654321', confirmPassword: '654321' } } })
  @Put("change-password")
  @HttpCode(HttpStatus.OK)
  async chengePassword(@Req() req: Request & { user: any }, @Body() payload: ChengePasswordDto) {
    const payloads = { ...payload, email: req?.user?.email };
    const result = await this.authService.chengePassword(payloads);
    return {
      success: true,
      message: "Password changed successfully!",
    };
  }

  @Post("forgot-password")
  @ApiOperation({ summary: 'Send OTP to email for password reset' })
  @ApiBody({ schema: { example: { email: 'john@example.com' } } })
  @HttpCode(HttpStatus.OK)
  async forgetPassword(@Body() payload: { email: string }) {
    const result = await this.authService.forgetPassword(payload.email);
    return {
      success: true,
      message: result.message,
    };
  }

  @Post("verify-reset-password-otp")
  @ApiOperation({ summary: 'Verify OTP for password reset' })
  @ApiBody({ schema: { example: { email: 'john@example.com', otp: '123456' } } })
  @HttpCode(HttpStatus.OK)
  async verifyResetPasswordOTP(@Body() payload: { email: string; otp: string }) {
    const result = await this.authService.verifyResetPasswordOTP(payload);
    return {
      success: true,
      message: result.message,
    };
  }

  @Post("reset-password")
  @ApiOperation({ summary: 'Reset password with new password' })
  @ApiBody({ schema: { example: { email: 'john@example.com', newPassword: '654321', confirmPassword: '654321' } } })
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() payload: ForgetPasswordDto) {
    const result = await this.authService.resetPassword(payload);
    return {
      success: true,
      message: result.message,
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current logged in user' })
  @Get("me")
  @HttpCode(HttpStatus.OK)
  async getMe(@Req() req: Request & { user: any }) {
    const result = await this.authService.getMe(req.user.email);
    return {
      success: true,
      message: "User fetched successfully!",
      data: result,
    };
  }

  @Post("refresh-token")
  @ApiOperation({ summary: 'Generate new access token with refresh token' })
  @ApiBody({ schema: { example: { token: 'your_refresh_token' } } })
  @HttpCode(HttpStatus.OK)
  async refeshToken(@Body() payload: { token: string }) {
    const result = await this.authService.refeshToken(payload.token);
    return {
      success: true,
      message: "Access token regenerated successfully",
      data: result,
    };
  }
}