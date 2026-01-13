-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('GENERATED', 'PAID');

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "baseSalary" INTEGER NOT NULL DEFAULT 50000;

-- CreateTable
CREATE TABLE "Payroll" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "baseSalary" INTEGER NOT NULL,
    "allowances" INTEGER NOT NULL DEFAULT 0,
    "deductions" INTEGER NOT NULL DEFAULT 0,
    "netSalary" INTEGER NOT NULL,
    "status" "PayrollStatus" NOT NULL DEFAULT 'GENERATED',
    "paymentDate" TIMESTAMP(3),
    "employeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payroll_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Payroll" ADD CONSTRAINT "Payroll_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
