import { 
  Controller, Post, Body, UseGuards, Request, Get, UnauthorizedException 
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any) {
    const { email, password, portal } = body;

    // 1. Verify credentials and get the user record
    const user = await this.authService.validateUser(email, password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 2. PORTAL ISOLATION LOGIC
    const isAdminRole = user.role === 'SUPER_ADMIN' || user.role === 'HR_ADMIN';

    // Block non-admins from the Admin portal
    if (portal === 'admin' && !isAdminRole) {
      throw new UnauthorizedException('Access Denied: You do not have Admin privileges.');
    }

    // Block admins from the Employee portal (Portal Separation)
    // Note: returning "Invalid email..." obscures the specific reason for security
    if (portal === 'employee' && isAdminRole) {
      throw new UnauthorizedException('Invalid email or password'); 
    }

    // 3. Generate token
    return this.authService.login(user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('create-user')
  async createEmployeeLogin(
    @Request() req, 
    @Body() body: { employeeId: string; email: string; password: string; role: any }
  ) {
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'HR_ADMIN') {
      throw new UnauthorizedException('SECURITY ALERT: Only Admins can create login accounts.');
    }

    return this.authService.createEmployeeLogin(
      body.employeeId, 
      body.email, 
      body.password, 
      body.role
    );
  }

  // --- UPDATED PROFILE ENDPOINT ---
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async getProfile(@Request() req) {
    // req.user contains the payload decoded from the JWT token.
    // Depending on your JwtStrategy, the ID is usually in `userId` or `id`.
    // We pass this ID to the service to fetch the full details including Employee data.
    return this.authService.getUserProfile(req.user.userId || req.user.id);
  }
}