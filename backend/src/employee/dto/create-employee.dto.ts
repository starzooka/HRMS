import { IsString, IsNotEmpty, IsEmail, IsOptional, IsDateString } from 'class-validator';

export class CreateEmployeeDto {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string; // We will use this to create a User login automatically later

  @IsNotEmpty()
  @IsString()
  designation: string;

  @IsNotEmpty()
  @IsDateString() // Validates YYYY-MM-DD
  joiningDate: string;

  @IsOptional()
  departmentId?: number;
}