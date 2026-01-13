import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    
    // Use bcrypt to compare provided password with stored hash
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result; // result includes id, email, and role
    }
    return null;
  }

  async login(user: any) {
    // We include the role in the JWT payload for backend security checks
    // 'sub' is the standard JWT claim for Subject (User ID)
    const payload = { email: user.email, sub: user.id, role: user.role };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role 
      }
    };
  }

  async createEmployeeLogin(employeeId: string, email: string, password: string, role: 'EMPLOYEE' | 'HR_ADMIN' | 'SUPER_ADMIN') {
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new BadRequestException('Email already has a login account');

    const hashedPassword = await bcrypt.hash(password, 10);

    // Atomic transaction: both User creation and Employee link must succeed or both fail
    return this.prisma.$transaction(async (prisma) => {
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: role,
        },
      });

      await prisma.employee.update({
        where: { id: employeeId },
        data: { userId: newUser.id },
      });

      const { password: _, ...result } = newUser;
      return result;
    });
  }

  // --- NEW METHOD: Get Full User Profile with Employee Details ---
  async getUserProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        // Include the linked Employee data
        employee: {
          include: {
            department: true, // Include Department details (name, etc.)
          },
        },
      },
    });
  }
}