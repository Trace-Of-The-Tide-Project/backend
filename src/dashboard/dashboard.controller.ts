import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
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
