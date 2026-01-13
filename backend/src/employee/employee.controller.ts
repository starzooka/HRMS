import { 
  Controller, Get, Post, Body, Patch, Param, Delete, 
  UseGuards, Request, UnauthorizedException 
} from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt')) 
@Controller('employee')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  private ensureAdmin(user: any) {
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'HR_ADMIN') {
      throw new UnauthorizedException('ACCESS DENIED: Insufficient Permissions');
    }
  }

  @Post()
  create(@Request() req, @Body() createEmployeeDto: CreateEmployeeDto) {
    this.ensureAdmin(req.user);
    return this.employeeService.create(createEmployeeDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.employeeService.findAll();
  }

  // --- 👇 THIS WAS MISSING 👇 ---
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeeService.findOne(id);
  }
  // -----------------------------

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() updateEmployeeDto: any) {
    this.ensureAdmin(req.user);
    return this.employeeService.update(id, updateEmployeeDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    this.ensureAdmin(req.user);
    return this.employeeService.remove(id);
  }
}