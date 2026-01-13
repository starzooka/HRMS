import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaveService {
  constructor(private prisma: PrismaService) {}

  // Helper: Find Employee
  private async getEmployee(userId: string) {
    return this.prisma.employee.findUnique({ where: { userId } });
  }

  // --- 1. APPLY FOR LEAVE ---
  async applyLeave(userId: string, data: any) {
    const employee = await this.getEmployee(userId);
    if (!employee) throw new BadRequestException('No employee profile found');

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    // Basic Validation
    if (start > end) throw new BadRequestException('Start date cannot be after end date');
    
    // Calculate Days (Simple calculation)
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 

    // Check Balance Logic
    if (data.type === 'SICK' && employee.sickLeaveBalance < daysCount) 
      throw new BadRequestException(`Insufficient Sick Leave Balance (Available: ${employee.sickLeaveBalance})`);
    
    if (data.type === 'CASUAL' && employee.casualLeaveBalance < daysCount) 
      throw new BadRequestException(`Insufficient Casual Leave Balance (Available: ${employee.casualLeaveBalance})`);

    if (data.type === 'EARNED' && employee.earnedLeaveBalance < daysCount) 
      throw new BadRequestException(`Insufficient Earned Leave Balance (Available: ${employee.earnedLeaveBalance})`);

    // Create Request
    return this.prisma.leaveRequest.create({
      data: {
        startDate: start,
        endDate: end,
        daysCount: daysCount,
        type: data.type,
        reason: data.reason,
        status: 'PENDING',
        employeeId: employee.id
      }
    });
  }

  // --- 2. GET MY HISTORY (Employee) ---
  async getMyLeaves(userId: string) {
    const employee = await this.getEmployee(userId);
    if (!employee) return [];

    return this.prisma.leaveRequest.findMany({
      where: { employeeId: employee.id },
      orderBy: { createdAt: 'desc' }
    });
  }

  // --- 3. GET PENDING REQUESTS (Admin) ---
  async getAllPending() {
    return this.prisma.leaveRequest.findMany({
      where: { status: 'PENDING' },
      include: { 
        employee: {
          include: { department: true }
        } 
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  // --- 4. APPROVE / REJECT (Admin) ---
  async processLeave(requestId: string, status: 'APPROVED' | 'REJECTED', adminComment?: string) {
    const leave = await this.prisma.leaveRequest.findUnique({ where: { id: requestId } });
    if (!leave) throw new NotFoundException('Request not found');
    if (leave.status !== 'PENDING') throw new BadRequestException('Request is already processed');

    // If APPROVED, deduct balance from Employee Table automatically
    if (status === 'APPROVED') {
      const updateData: any = {};
      
      if (leave.type === 'SICK') updateData.sickLeaveBalance = { decrement: leave.daysCount };
      if (leave.type === 'CASUAL') updateData.casualLeaveBalance = { decrement: leave.daysCount };
      if (leave.type === 'EARNED') updateData.earnedLeaveBalance = { decrement: leave.daysCount };

      // Update Employee Balance
      await this.prisma.employee.update({
        where: { id: leave.employeeId },
        data: updateData
      });
    }

    // Update Request Status
    return this.prisma.leaveRequest.update({
      where: { id: requestId },
      data: { 
        status: status,
        adminComment: adminComment
      }
    });
  }
  
  // --- 5. GET BALANCES (For Dashboard) ---
  async getBalances(userId: string) {
    const emp = await this.getEmployee(userId);
    if (!emp) return null;
    return {
      sick: emp.sickLeaveBalance,
      casual: emp.casualLeaveBalance,
      earned: emp.earnedLeaveBalance
    };
  }
}