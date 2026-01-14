-- AlterTable
ALTER TABLE "Appraisal" ADD COLUMN     "currentSalary" INTEGER,
ADD COLUMN     "hikePercentage" DOUBLE PRECISION,
ADD COLUMN     "isAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "proposedSalary" INTEGER;
