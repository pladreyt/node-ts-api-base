import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

export class RecoverPassDTO {
  @MaxLength(40, { message: 'email cannot have more than $constraint1 characters' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
