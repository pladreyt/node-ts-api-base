import { IsEmail, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class ResetPassDTO {
  @MaxLength(40, { message: 'Email cannot have more than $constraint1 characters' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @MaxLength(30, { message: 'Password cannot have more than $constraint1 characters' })
  @MinLength(6, { message: 'Password cannot have less than $constraint1 characters' })
  @IsNotEmpty()
  password: string;

  @MaxLength(32, {
    message: 'PasswordHash cannot have more than $constraint1 characters'
  })
  @MinLength(6, {
    message: 'PasswordHash cannot have less than $constraint1 characters'
  })
  @IsNotEmpty()
  passwordHash: string;
}
