import { IsEmail, IsEmpty, IsNotEmpty, IsString } from "class-validator"

export class ForgetPasswordDto{
    @IsNotEmpty()
    @IsEmail()
email: string
@IsNotEmpty()
@IsString()
  newPassword: string
@IsNotEmpty()
  @IsString()
  confirmPassword: string

}