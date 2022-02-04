import { IsEmail, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class BaseUserDTO {
  @MaxLength(40, { message: 'email cannot have more than $constraint1 characters' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @MinLength(6)
  @IsNotEmpty()
  password: string;
}
