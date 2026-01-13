import { 
  Controller, Get, Post, Body, Patch, Param, Delete, 
  UseGuards, Request, UnauthorizedException 
} from '@nestjs/common';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('department')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  // --- SECURITY HELPER ---
  private ensureAdmin(user: any) {
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'HR_ADMIN') {
      throw new UnauthorizedException('ACCESS DENIED: Admins Only');
    }
  }

  @Post()
  create(@Request() req, @Body() createDepartmentDto: CreateDepartmentDto) {
    this.ensureAdmin(req.user); // <--- Security Check
    return this.departmentService.create(createDepartmentDto);
  }

  @Get()
  findAll() {
    // Open to all authenticated users (required for UI dropdowns)
    return this.departmentService.findAll();
  }

  @Patch(':id') 
  update(@Request() req, @Param('id') id: string, @Body() createDepartmentDto: CreateDepartmentDto) {
    this.ensureAdmin(req.user); // <--- Security Check
    return this.departmentService.update(+id, createDepartmentDto);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string, 
    @Request() req, 
    @Body('password') password: string
  ) {
    this.ensureAdmin(req.user); // <--- Security Check
    return this.departmentService.remove(+id, req.user.userId, password);
  }
}