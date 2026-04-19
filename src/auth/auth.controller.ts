import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt/auth.guard';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CheckEmailDto } from './dto/check-email.dto';
import { Verify2FADto, Validate2FADto, Disable2FADto } from './dto/setup-2fa.dto';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('check-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check if an email is valid and available for registration',
    description:
      'Validates the email domain (MX records), blocks disposable providers, and checks if the email is already registered.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns availability and validity status',
  })
  async checkEmail(@Body() dto: CheckEmailDto) {
    return this.authService.checkEmail(dto.email);
  }

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user (auto-login on success)' })
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email or username and password' })
  async login(@Body() loginDto: LoginDto, @Req() req: any) {
    return this.authService.login(loginDto, req);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email using token from verification email',
  })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmail(@Body('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend email verification link' })
  async resendVerification(@Req() req) {
    return this.authService.resendVerificationEmail(req.user.sub);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request a password reset email',
    description:
      'Sends a reset link to the provided email. Rate limited to 1 request per 60 seconds.',
  })
  @ApiResponse({
    status: 200,
    description: 'Reset email sent (even if email not found, for security)',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests — cooldown active',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.generateResetToken(dto.email);
  }

  @Post('resend-reset-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend password reset email',
    description:
      'Resends the reset email with a 48-second cooldown between requests.',
  })
  @ApiResponse({ status: 200, description: 'Reset email resent' })
  @ApiResponse({
    status: 429,
    description: 'Too many requests — cooldown active',
  })
  async resendResetEmail(@Body() dto: ForgotPasswordDto) {
    return this.authService.resendResetEmail(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password using token from email',
    description:
      'Validates the token, checks passwords match, updates password, and invalidates token.',
  })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid/expired token or passwords do not match',
  })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(
      dto.token,
      dto.newPassword,
      dto.confirmPassword,
    );
  }

  @Post('set-new-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reset password using token from Authorization header',
    description: 'Send the reset token as "Authorization: Bearer <token>". Body only needs newPassword and confirmPassword.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['newPassword', 'confirmPassword'],
      properties: {
        newPassword: { type: 'string', minLength: 8, example: 'NewPass@123' },
        confirmPassword: { type: 'string', minLength: 8, example: 'NewPass@123' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid/expired token or passwords do not match' })
  async setNewPassword(
    @Headers('authorization') authorization: string,
    @Body('newPassword') newPassword: string,
    @Body('confirmPassword') confirmPassword: string,
  ) {
    if (!authorization) {
      throw new BadRequestException('Authorization header with reset token is required');
    }
    const token = authorization.replace(/^Bearer\s+/i, '').trim();
    return this.authService.resetPassword(token, newPassword, confirmPassword);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and revoke refresh tokens' })
  async logout(@Req() req, @Body('refreshToken') refreshToken?: string) {
    return this.authService.logout(req.user.sub, refreshToken);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get new access token using refresh token' })
  @ApiBody({
    schema: {
      properties: {
        refreshToken: { type: 'string' },
        accessToken: {
          type: 'string',
          description:
            'Expired access token (used to scope lookup for performance)',
        },
      },
    },
  })
  async refreshToken(
    @Body('refreshToken') refreshToken: string,
    @Body('accessToken') accessToken?: string,
  ) {
    return this.authService.refreshAccessToken(refreshToken, accessToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user with roles' })
  async me(@Req() req) {
    return this.authService.getUserFromToken(req.user.sub);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change password (authenticated user)',
    description:
      'Requires current password. Revokes all sessions after change.',
  })
  async changePassword(@Req() req, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(
      req.user.sub,
      dto.currentPassword,
      dto.newPassword,
      dto.confirmPassword,
    );
  }

  // ─── 2FA ────────────────────────────────────────────────────

  @Post('2fa/setup')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Generate TOTP secret and QR code to set up 2FA (admin only)',
  })
  async setup2FA(@Req() req: any) {
    return this.authService.setup2FA(req.user.sub);
  }

  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Confirm TOTP code to activate 2FA and receive backup codes',
  })
  async verify2FA(@Req() req: any, @Body() dto: Verify2FADto) {
    return this.authService.verify2FA(req.user.sub, dto.code);
  }

  @Post('2fa/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit TOTP code after login returned requires_2fa=true',
    description: 'Pass the temp_token from the login response and the 6-digit TOTP code.',
  })
  async validate2FA(@Body() dto: Validate2FADto, @Req() req: any) {
    return this.authService.validate2FA(dto.temp_token, dto.code, req);
  }

  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Disable 2FA for authenticated admin (requires current password)',
  })
  async disable2FA(@Req() req: any, @Body() dto: Disable2FADto) {
    return this.authService.disable2FA(req.user.sub, dto.password);
  }
}
