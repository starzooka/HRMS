import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { EmployeeModule } from './employee/employee.module';
import { DepartmentModule } from './department/department.module';
import { AttendanceModule } from './attendance/attendance.module';
import { LeaveModule } from './leave/leave.module'; // <--- IMPORT THIS
import { PayrollModule } from './payroll/payroll.module';
import { PerformanceModule } from './performance/performance.module';

@Module({
  imports: [
    AuthModule, 
    PrismaModule, 
    EmployeeModule, 
    DepartmentModule, 
    AttendanceModule, 
    LeaveModule,
    PayrollModule,
    PerformanceModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}