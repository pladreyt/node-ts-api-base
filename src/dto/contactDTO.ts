import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ContactDTO {
  @MaxLength(40, { message: 'email cannot have more than $constraint1 characters' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @MaxLength(20, { message: 'firstName cannot have more than $constraint1 characters' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @MaxLength(20, { message: 'lastName cannot have more than $constraint1 characters' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @MaxLength(40, { message: 'subject cannot have more than $constraint1 characters' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @MaxLength(300, { message: 'body cannot have more than $constraint1 characters' })
  @IsString()
  @IsNotEmpty()
  body: string;
}
