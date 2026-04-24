import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}
  @Get('overview')
  async getDashboardOverview() {
    const result= await this.dashboardService.getDashboardOverview();

    return {
      statusCode:HttpStatus.OK,
      success:true,
      message:"Dashboard overview fetched successfully!",
      data:result
    }
  }

 @Get('earning-overview')
  async getEarningOverview() {
    const result= await this.dashboardService.getEarningOverview();

    return {
      statusCode:HttpStatus.OK,
      success:true,
      message:"Dashboard earning overview fetched successfully!",
      data:result
    }
  }
}
