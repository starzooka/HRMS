import { Controller, Get, Post, UseGuards, Request, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('clock-in')
  clockIn(@Request() req) {
    return this.attendanceService.clockIn(req.user.userId);
  }

  @Post('clock-out')
  clockOut(@Request() req) {
    return this.attendanceService.clockOut(req.user.userId);
  }

  @Get('status')
  getStatus(@Request() req) {
    return this.attendanceService.getTodayStatus(req.user.userId);
  }

  @Get('report')
  getDailyReport(
    @Query('date') date: string,
    @Query('departmentId') departmentId?: string
  ) {
    return this.attendanceService.getDailyReport(
      date, 
      departmentId ? Number(departmentId) : undefined
    );
  }

  // --- NEW: Monthly Grid Endpoint ---
  @Get('monthly')
  getMonthlyReport(
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('departmentId') departmentId?: string
  ) {
    return this.attendanceService.getMonthlyReport(
      Number(month), 
      Number(year), 
      departmentId ? Number(departmentId) : undefined
    );
  }
}