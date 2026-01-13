import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  // Admin: Generate Payroll for a specific Month/Year
  @Post('generate')
  generate(@Body() body: { month: string; year: number }) {
    return this.payrollService.generatePayroll(body.month, body.year);
  }

  // Admin: View All History
  @Get('all')
  getAll() {
    return this.payrollService.getAllPayrolls();
  }
  
  // Admin: Mark a specific slip as Paid
  @Post('pay/:id')
  markPaid(@Param('id') id: string) {
    return this.payrollService.markAsPaid(id);
  }

  // Employee: View My Pay History
  @Get('my-history')
  getMyHistory(@Request() req) {
    return this.payrollService.getMyPayrolls(req.user.userId);
  }
}