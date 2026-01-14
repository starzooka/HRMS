import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PerformanceService {
  constructor(private prisma: PrismaService) {}

  // --- 1. ADMIN: CREATE CYCLE ---
  async createCycle(data: any) {
    // 1. Create the Cycle
    const cycle = await this.prisma.performanceCycle.create({
      data: {
        title: data.title,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      }
    });

    // 2. Auto-generate Appraisal entries for ALL active employees
    const employees = await this.prisma.employee.findMany();
    
    if (employees.length > 0) {
      const appraisals = employees.map(emp => ({
        employeeId: emp.id,
        cycleId: cycle.id,
        status: 'PENDING_SELF'
      }));

      // createMany is supported in Postgres
      await this.prisma.appraisal.createMany({
        data: appraisals as any
      });
    }

    return cycle;
  }

  // --- 2. GET ALL CYCLES (For Dropdown) ---
  async getAllCycles() {
    return this.prisma.performanceCycle.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  // --- 3. GET APPRAISALS FOR A CYCLE (Admin Dashboard) ---
  async getCycleReviews(cycleId: string) {
    return this.prisma.appraisal.findMany({
      where: { cycleId },
      include: { 
        employee: {
          include: { department: true }
        } 
      },
      orderBy: { employee: { firstName: 'asc' } }
    });
  }

  // --- 4. GET MY APPRAISAL (Employee View) ---
  async getMyAppraisal(userId: string) {
    const emp = await this.prisma.employee.findUnique({ where: { userId } });
    if (!emp) throw new BadRequestException('Profile not found');

    // Find the latest active review
    return this.prisma.appraisal.findFirst({
      where: { 
        employeeId: emp.id,
        cycle: { isActive: true } 
      },
      include: { cycle: true }
    });
  }

  // --- 5. SUBMIT SELF REVIEW (Employee) ---
  async submitSelfReview(userId: string, appraisalId: string, reviewText: string) {
    const appraisal = await this.prisma.appraisal.findUnique({ where: { id: appraisalId } });
    if (!appraisal) throw new NotFoundException('Appraisal not found');

    // Security: Ensure this appraisal belongs to the logged-in user
    const emp = await this.prisma.employee.findUnique({ where: { userId } });
    
    // Check if emp exists before accessing .id
    if (!emp) throw new BadRequestException('Employee profile not found');
    
    if (appraisal.employeeId !== emp.id) throw new BadRequestException('Unauthorized');

    return this.prisma.appraisal.update({
      where: { id: appraisalId },
      data: {
        selfReview: reviewText,
        status: 'PENDING_MANAGER' // Move to next stage
      }
    });
  }

  // --- 6. SUBMIT MANAGER REVIEW (Admin) ---
  async submitManagerReview(appraisalId: string, data: any) {
    return this.prisma.appraisal.update({
      where: { id: appraisalId },
      data: {
        managerReview: data.managerReview,
        rating: Number(data.rating),
        status: 'COMPLETED'
      }
    });
  }

  // --- 7. HR: PROPOSE OR UPDATE HIKE (Admin) ---
  async proposeHike(appraisalId: string, percentage: number) {
    const appraisal = await this.prisma.appraisal.findUnique({
      where: { id: appraisalId },
      include: { employee: true }
    });

    if (!appraisal) throw new NotFoundException('Appraisal not found');

    // Calculate New Salary
    const currentSalary = appraisal.employee.baseSalary;
    const hikeAmount = Math.round(currentSalary * (percentage / 100));
    const newSalary = currentSalary + hikeAmount;

    // Save Proposal (Does NOT update Employee table yet)
    return this.prisma.appraisal.update({
      where: { id: appraisalId },
      data: {
        currentSalary: currentSalary,
        hikePercentage: percentage,
        proposedSalary: newSalary,
        isAccepted: false // Reset acceptance if HR updates the offer
      }
    });
  }

  // --- 8. EMPLOYEE: ACCEPT HIKE (Employee) ---
  async acceptHike(userId: string, appraisalId: string) {
    const appraisal = await this.prisma.appraisal.findUnique({
      where: { id: appraisalId },
      include: { employee: true }
    });

    // Security Checks
    if (!appraisal) throw new NotFoundException('Appraisal not found');
    if (appraisal.employee.userId !== userId) throw new BadRequestException('Unauthorized');
    if (!appraisal.proposedSalary) throw new BadRequestException('No hike has been proposed yet.');

    // 1. Update Employee Base Salary (The "Real" Change)
    await this.prisma.employee.update({
      where: { id: appraisal.employeeId },
      data: { baseSalary: appraisal.proposedSalary }
    });

    // 2. Mark Appraisal as Accepted
    return this.prisma.appraisal.update({
      where: { id: appraisalId },
      data: { isAccepted: true }
    });
  }
}