import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginPayloadDto{

  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
    email:string 

    @IsNotEmpty({message:"password is required"})
    @IsString()
    password:string
}