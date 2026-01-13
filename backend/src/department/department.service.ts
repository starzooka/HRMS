import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DepartmentService {
  constructor(private prisma: PrismaService) {}

  async create(createDepartmentDto: CreateDepartmentDto) {
    return this.prisma.department.create({
      data: {
        name: createDepartmentDto.name,
      },
    });
  }

  async findAll() {
    return this.prisma.department.findMany({
      include: {
        _count: {
          select: { employees: true },
        },
      },
      orderBy: {
        id: 'asc', // Sort by ID so the list doesn't jump around
      },
    });
  }

  async update(id: number, data: any) {
    return this.prisma.department.update({
      where: { id },
      data: { name: data.name },
    });
  }

  // --- UPDATED SECURE DELETE ---
  async remove(id: number, userId: string, passwordString: string) {
    // 1. Fetch the user performing the action to check their password
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // 2. Check if a password was actually provided
    if (!passwordString) {
      throw new UnauthorizedException('Password is required');
    }

    // 3. Verify the password
    const isPasswordValid = await bcrypt.compare(passwordString, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('INVALID PASSWORD');
    }

    // 4. If valid, proceed with delete
    return this.prisma.department.delete({
      where: { id },
    });
  }
}