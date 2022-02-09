import { IsEmail, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class ResetPassDTO {
  @MaxLength(40, { message: 'email cannot have more than $constraint1 characters' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @MaxLength(30, { message: 'password cannot have more than $constraint1 characters' })
  @MinLength(6, { message: 'password cannot have less than $constraint1 characters' })
  @IsNotEmpty()
  password: string;

  @MaxLength(32, {
    message: 'passwordHash cannot have more than $constraint1 characters'
  })
  @MinLength(6, {
    message: 'passwordHash cannot have less than $constraint1 characters'
  })
  @IsNotEmpty()
  passwordHash: string;
}
