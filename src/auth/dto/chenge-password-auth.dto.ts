import { IsEmail, IsEmpty, IsOptional, IsString, isString } from "class-validator"

export class ChengePasswordDto {
 
  @IsOptional()
 @IsEmail()
  email: string

 @IsString()
  currentPassword: string
  
 @IsString()
  newPassword: string
  
 @IsString()
  confirmPassword: string
}

