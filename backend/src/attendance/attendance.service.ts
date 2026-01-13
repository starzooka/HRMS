import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  // Helper: Find Employee ID based on logged-in User ID
  private async getEmployeeId(userId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
    });
    return employee ? employee.id : null;
  }

  // Helper: Get Today's Date at Midnight
  private getTodayDate() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  // --- 1. CLOCK IN ---
  async clockIn(userId: string) {
    const employeeId = await this.getEmployeeId(userId);
    if (!employeeId) throw new BadRequestException('No Employee Profile linked to this user.');

    const today = this.getTodayDate();

    // Check if already clocked in
    const existing = await this.prisma.attendance.findUnique({
      where: {
        date_employeeId: {
          date: today,
          employeeId: employeeId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('You have already clocked in today.');
    }

    return this.prisma.attendance.create({
      data: {
        date: today,
        clockIn: new Date(),
        status: 'PRESENT',
        employeeId: employeeId,
      },
    });
  }

  // --- 2. CLOCK OUT ---
  async clockOut(userId: string) {
    const employeeId = await this.getEmployeeId(userId);
    if (!employeeId) throw new BadRequestException('No Employee Profile linked to this user.');

    const today = this.getTodayDate();

    const record = await this.prisma.attendance.findUnique({
      where: {
        date_employeeId: {
          date: today,
          employeeId: employeeId,
        },
      },
    });

    if (!record) throw new BadRequestException('You have not clocked in yet!');
    if (record.clockOut) throw new BadRequestException('You have already clocked out today.');

    return this.prisma.attendance.update({
      where: { id: record.id },
      data: {
        clockOut: new Date(),
        status: 'COMPLETED',
      },
    });
  }

  // --- 3. GET STATUS (For Employee Dashboard) ---
  async getTodayStatus(userId: string) {
    const employeeId = await this.getEmployeeId(userId);
    if (!employeeId) return { status: 'NO_PROFILE' };

    const today = this.getTodayDate();
    const record = await this.prisma.attendance.findUnique({
      where: {
        date_employeeId: {
          date: today,
          employeeId: employeeId,
        },
      },
    });

    if (!record) return { status: 'NOT_STARTED' };
    if (record.clockOut) {
      return { 
        status: 'COMPLETED', 
        punchIn: record.clockIn,   
        punchOut: record.clockOut 
      };
    }
    return { status: 'WORKING', punchIn: record.clockIn };
  }

  // --- 4. GET DAILY REPORT (For Admin Daily View) ---
  async getDailyReport(dateString: string, departmentId?: number) {
    const start = new Date(dateString);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateString);
    end.setHours(23, 59, 59, 999);

    const whereClause: any = {};
    if (departmentId) whereClause.departmentId = Number(departmentId);

    const employees = await this.prisma.employee.findMany({
      where: whereClause,
      include: {
        department: true,
        attendanceRecords: {
          where: { date: { gte: start, lte: end } }
        }
      }
    });

    return employees.map(emp => {
      const record = emp.attendanceRecords[0];
      let status = 'ABSENT';
      if (record) {
        status = record.status;
        if (record.clockOut) status = 'COMPLETED';
        else status = 'WORKING';
      }

      return {
        id: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        department: emp.department?.name || 'N/A',
        punchIn: record?.clockIn || null,
        punchOut: record?.clockOut || null,
        status: status
      };
    });
  }

  // --- 5. GET MONTHLY REPORT (For Admin Grid View) ---
  async getMonthlyReport(month: number, year: number, departmentId?: number) {
    // Construct Date Range
    // Month input is 1-12. Javascript Date is 0-11.
    const startDate = new Date(year, month - 1, 1); 
    const endDate = new Date(year, month, 0); // 0th day of next month = last day of current month
    
    startDate.setHours(0,0,0,0);
    endDate.setHours(23,59,59,999);

    const whereClause: any = {};
    if (departmentId) whereClause.departmentId = Number(departmentId);

    // Fetch Employees AND their attendance records for the whole month
    const employees = await this.prisma.employee.findMany({
      where: whereClause,
      orderBy: { lastName: 'asc' },
      include: {
        department: true,
        attendanceRecords: {
          where: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: { date: 'asc' }
        },
      },
    });

    return employees;
  }
}