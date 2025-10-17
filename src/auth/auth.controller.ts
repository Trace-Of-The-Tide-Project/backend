import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Request,
  Headers,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { AuthGuard } from '@nestjs/passport';


@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  // --- Signup ---
  @Post('signup')
  async signup(@Body() signupDto: any) {
    return this.authService.signup(signupDto);
  }

  // --- Login ---
  @Post('login')
  async login(@Body() loginDto: any) {
    return this.authService.login(loginDto);
  }

  // --- Forgot Password ---
  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.generateResetToken(email);
  }

  // --- Reset Password ---
  @Post('reset-password')
  async resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.authService.resetPassword(token, newPassword);
  }

  // --- Logout (JWT) ---
  //   @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req) {
    return this.authService.logout(req.user);
  }

  @Post('refresh-token')
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshAccessToken(refreshToken);
  }

  @Get('me')
  async me(@Headers('authorization') authHeader: string) {
    const token = authHeader.replace('Bearer ', '');
    return this.authService.getUserFromToken(token);
  }

  @Get('test')
  testErr(){
  return 'hahahahaahahha'
  }
}
