import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  // --- 1. GENERATE PAYROLL (Admin) ---
  async generatePayroll(month: string, year: number) {
    // 1. Check if payroll already exists for this month/year
    // We check if at least one record exists to prevent duplicates
    const existing = await this.prisma.payroll.findFirst({
      where: { month, year }
    });
    
    if (existing) {
      throw new BadRequestException(`Payroll for ${month} ${year} has already been generated.`);
    }

    // 2. Fetch all employees
    const employees = await this.prisma.employee.findMany();

    if (employees.length === 0) {
      throw new BadRequestException("No employees found to generate payroll.");
    }

    // 3. Calculate Salary for each employee
    const payrolls = employees.map((emp) => {
      // LOGIC: Simple Calculation for V1
      // Tax = 10% of Base Salary
      const tax = Math.floor(emp.baseSalary * 0.1); 
      
      // Net = Base - Tax
      const net = emp.baseSalary - tax;

      return {
        month,
        year: Number(year),
        baseSalary: emp.baseSalary,
        allowances: 0,       // Future: Add logic for bonuses
        deductions: tax,     // Future: Add logic for LOP (Loss of Pay)
        netSalary: net,
        status: 'GENERATED', // Default status
        employeeId: emp.id
      };
    });

    // 4. Bulk Insert into Database
    await this.prisma.payroll.createMany({
      data: payrolls as any
    });

    return { message: `Successfully generated payroll for ${employees.length} employees.` };
  }

  // --- 2. GET ALL RECORDS (Admin Dashboard) ---
  async getAllPayrolls() {
    return this.prisma.payroll.findMany({
      include: { 
        employee: {
          include: { department: true }
        } 
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // --- 3. GET MY SLIPS (Employee Dashboard) ---
  async getMyPayrolls(userId: string) {
    const emp = await this.prisma.employee.findUnique({ where: { userId } });
    if (!emp) return [];

    return this.prisma.payroll.findMany({
      where: { employeeId: emp.id },
      orderBy: { createdAt: 'desc' }
    });
  }
  
  // --- 4. MARK AS PAID (Admin Action) ---
  async markAsPaid(id: string) {
    return this.prisma.payroll.update({
      where: { id },
      data: { 
        status: 'PAID', 
        paymentDate: new Date() 
      }
    });
  }
}