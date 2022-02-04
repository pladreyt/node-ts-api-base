import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { BaseUserDTO } from './baseUserDTO';
import { Gender } from '@constants/users/attributes.constants';

export class SignUpDTO extends BaseUserDTO {
  @MaxLength(20, { message: 'firstName cannot have more than $constraint1 characters' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @MaxLength(20, { message: 'lastName cannot have more than $constraint1 characters' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsEnum( Gender )
  @IsNotEmpty()
  gender!: Gender;
}
