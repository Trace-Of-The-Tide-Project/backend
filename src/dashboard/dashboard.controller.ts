import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('users')
  async getUsers(
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const offset = (Number(page) - 1) * Number(limit);
    return this.dashboardService.getUsers({
      role,
      status,
      limit: Number(limit),
      offset,
    });
  }

  @Get('stats')
  async getStats() {
    return this.dashboardService.getStats();
  }
}
