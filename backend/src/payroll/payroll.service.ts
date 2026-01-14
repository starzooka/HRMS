import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  // --- 1. GENERATE PAYROLL (Smart Calculation) ---
  async generatePayroll(month: string, year: number) {
    // 1. Check if payroll already exists for this month/year
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
      // --- CTC BREAKDOWN LOGIC (Monthly) ---
      // 1. Calculate Monthly Gross from Annual CTC
      const monthlyCTC = emp.baseSalary / 12;

      // 2. Earnings Components
      const basic = Math.round(monthlyCTC * 0.50); // Basic is 50% of CTC
      const hra = Math.round(basic * 0.40);        // HRA is 40% of Basic
      const medical = 1250;                        // Fixed Medical Allowance
      // Special Allowance gets the remainder
      const specialAllowance = Math.max(0, monthlyCTC - (basic + hra + medical));

      const totalEarnings = basic + hra + medical + specialAllowance;

      // 3. Deductions Components
      const pf = Math.round(basic * 0.12);         // PF is 12% of Basic
      const professionalTax = 200;                 // Fixed PT
      
      // Simple Income Tax (TDS) Logic: 10% if Monthly Gross > 50k
      const tds = totalEarnings > 50000 ? Math.round(totalEarnings * 0.10) : 0; 

      const totalDeductions = pf + professionalTax + tds;

      // 4. Net Pay
      const netSalary = totalEarnings - totalDeductions;

      return {
        month,
        year: Number(year),
        baseSalary: emp.baseSalary, // Store Annual CTC for reference
        allowances: totalEarnings,  // Store Monthly Gross Earnings here
        deductions: totalDeductions, // Store Total Monthly Deductions
        netSalary: netSalary,
        status: 'GENERATED',
        employeeId: emp.id
      };
    });

    // 4. Bulk Insert
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