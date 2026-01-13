import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmployeeService {
  constructor(private prisma: PrismaService) {}

  // --- CREATE ---
  async create(data: any) {
    return this.prisma.employee.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        designation: data.designation,
        joiningDate: new Date(data.joiningDate),
        departmentId: data.departmentId,
      },
    });
  }

  // --- READ ALL ---
  async findAll() {
    return this.prisma.employee.findMany({
      include: {
        department: true, // Return department details for the dashboard
        user: true,       // Return login info (to show "HAS LOGIN" badge)
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // --- READ ONE (FULL PROFILE) ---
  // Updated to fetch everything for the Details Page
  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: { 
        department: true,
        user: true, // Login info
        
        // Fetch last 5 attendance records (Most recent first)
        attendanceRecords: { 
          orderBy: { date: 'desc' }, 
          take: 5 
        },
        
        // Fetch last 5 leave requests (Most recent first)
        leaveRequests: { 
          orderBy: { createdAt: 'desc' }, 
          take: 5 
        }
      }
    });

    if (!employee) throw new NotFoundException(`Employee with ID ${id} not found`);
    return employee;
  }

  // --- UPDATE ---
  async update(id: string, data: any) {
    return this.prisma.employee.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        designation: data.designation,
        joiningDate: new Date(data.joiningDate),
        departmentId: data.departmentId,
      },
    });
  }

  // --- DELETE ---
  async remove(id: string) {
    // 1. Find the employee first to check for a linked User ID
    const employee = await this.prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // 2. Logic: If the employee has a login account (userId), we must delete BOTH.
    if (employee.userId) {
      return this.prisma.$transaction([
        // Delete the Employee Profile (Child)
        // Note: This automatically deletes Attendance/Leave/Payroll due to 'onDelete: Cascade' in Schema
        this.prisma.employee.delete({
          where: { id },
        }),

        // Delete the User Login (Parent)
        this.prisma.user.delete({
          where: { id: employee.userId },
        }),
      ]);
    }

    // 3. If no login exists, just delete the employee profile
    return this.prisma.employee.delete({
      where: { id },
    });
  }
}