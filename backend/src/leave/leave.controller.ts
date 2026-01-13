import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { LeaveService } from './leave.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('leaves')
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  // Employee: Apply
  @Post('apply')
  applyLeave(@Request() req, @Body() body: any) {
    return this.leaveService.applyLeave(req.user.userId, body);
  }

  // Employee: View History
  @Get('my-history')
  getMyHistory(@Request() req) {
    return this.leaveService.getMyLeaves(req.user.userId);
  }

  // Employee: Get Balance
  @Get('balance')
  getBalance(@Request() req) {
    return this.leaveService.getBalances(req.user.userId);
  }

  // --- ADMIN ROUTES ---
  
  // Admin: View Pending
  @Get('pending')
  getPendingLeaves() {
    return this.leaveService.getAllPending();
  }

  // Admin: Approve/Reject
  @Post('action/:id')
  processLeave(
    @Param('id') id: string, 
    @Body() body: { status: 'APPROVED' | 'REJECTED', comment?: string }
  ) {
    return this.leaveService.processLeave(id, body.status, body.comment);
  }
}