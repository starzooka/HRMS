import { Controller, Get, Post, Body, Param, UseGuards, Request, Patch } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('performance')
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  // Admin: Create Cycle
  @Post('cycle')
  createCycle(@Body() body: any) {
    return this.performanceService.createCycle(body);
  }

  // Admin: Get Cycles
  @Get('cycles')
  getCycles() {
    return this.performanceService.getAllCycles();
  }

  // Admin: Get Reviews for a Cycle
  @Get('reviews/:cycleId')
  getReviews(@Param('cycleId') cycleId: string) {
    return this.performanceService.getCycleReviews(cycleId);
  }

  // Employee: Get My Active Review
  @Get('my-review')
  getMyReview(@Request() req) {
    return this.performanceService.getMyAppraisal(req.user.userId);
  }

  // Employee: Submit Self Review
  @Patch('self-review/:id')
  submitSelf(@Request() req, @Param('id') id: string, @Body() body: { review: string }) {
    return this.performanceService.submitSelfReview(req.user.userId, id, body.review);
  }

  // Admin: Finalize Review
  @Patch('manager-review/:id')
  submitManager(@Param('id') id: string, @Body() body: any) {
    return this.performanceService.submitManagerReview(id, body);
  }
}