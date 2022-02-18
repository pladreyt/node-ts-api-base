import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ContactDTO {
  @MaxLength(40, { message: 'Email cannot have more than $constraint1 characters' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @MaxLength(20, { message: 'First name cannot have more than $constraint1 characters' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @MaxLength(20, { message: 'Last name cannot have more than $constraint1 characters' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @MaxLength(40, { message: 'Subject cannot have more than $constraint1 characters' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @MaxLength(300, { message: 'Body cannot have more than $constraint1 characters' })
  @IsString()
  @IsNotEmpty()
  body: string;
}
