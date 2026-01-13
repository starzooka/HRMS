import { Module } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { PerformanceController } from './performance.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [PerformanceController],
  providers: [PerformanceService, PrismaService],
})
export class PerformanceModule {}