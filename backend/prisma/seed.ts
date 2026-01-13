import { PrismaClient, RoleType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Seeding...');

  // 1. Create Department
  const hrDept = await prisma.department.upsert({
    where: { name: 'Human Resources' },
    update: {},
    create: { name: 'Human Resources' },
  });

  // 2. Create Super Admin with REAL Hash
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt); // <--- Real Hash

  const adminEmail = 'admin@company.com';
  
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    // UPDATE block: If user exists, update the password
    update: { 
      password: hashedPassword 
    },
    create: {
      email: adminEmail,
      password: hashedPassword,
      role: RoleType.SUPER_ADMIN,
      isActive: true,
    },
  });
  console.log(`✅ Admin User Secured: ${adminUser.email} (Password: password123)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });