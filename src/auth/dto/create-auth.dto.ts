import { IsBoolean, IsDate, IsEmail, IsEnum, IsJSON, IsNotEmpty, IsObject, IsOptional, IsPhoneNumber, IsString } from "class-validator";
import { UserRole } from "generated/prisma/enums";

export class CreateAuthDto {
    @IsNotEmpty({ message: 'Full name is required' })
  @IsString()
  fullName: string;

  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  password: string;

 
   @IsOptional()
  location: any; // Prisma Json

  @IsOptional()
  @IsString()
  profilePic?: string;

  @IsString()
@IsOptional()
referralCode?: string;
}

export class GenerateOtpDto {
   @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
    email:string 
}
